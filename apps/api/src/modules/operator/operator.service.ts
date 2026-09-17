import { Injectable, Logger } from '@nestjs/common'
import argon2 from 'argon2'
import {
  ADMIN_EMAIL_REQUIRED_MESSAGE,
  type CreateOperatorInput,
  type DeletedOperator,
  type Operator,
  type UpdateOperatorInput,
} from '@pdv/shared'
import { ConflictError, DomainError, NotFoundError } from '../../common/errors/domain.error'
import type { OperatorSession } from '../../common/types/request'
import { PinTokenService } from '../auth/pin-token.service'
import { StorageService } from '../storage/storage.service'
import { OperatorNotEligibleForAnonymizationError, OperatorRepository, type OperatorRow } from './operator.repository'

const operatorNotFound = () => new NotFoundError('OPERATOR_NOT_FOUND', 'Operador não encontrado.')
const lastAdmin = () =>
  new ConflictError('LAST_ADMIN', 'Este é o único Administrador ativo da loja. Promova outro antes.')
const selfChange = () =>
  new ConflictError('SELF_CHANGE', 'Você não pode inativar, rebaixar ou excluir a sua própria conta.')
const emailInUse = () => new ConflictError('EMAIL_IN_USE', 'Já existe um operador com este e-mail.')
// Mesmo formato do 400 VALIDATION do pipe, para cair embaixo do campo na tela.
const adminNeedsEmail = () =>
  new DomainError('VALIDATION', 'Dados inválidos.', 400, {
    formErrors: [],
    fieldErrors: { email: [ADMIN_EMAIL_REQUIRED_MESSAGE] },
  })
const operatorNotDeleted = () =>
  new ConflictError('OPERATOR_NOT_DELETED', 'Só é possível remover os dados pessoais de um operador já excluído.')
const alreadyAnonymized = () =>
  new ConflictError('ALREADY_ANONYMIZED', 'Os dados pessoais deste operador já foram removidos.')

@Injectable()
export class OperatorService {
  private readonly logger = new Logger(OperatorService.name)

  constructor(
    private readonly operators: OperatorRepository,
    private readonly pinTokens: PinTokenService,
    private readonly storage: StorageService,
  ) {}

  async list(tenantId: string): Promise<Operator[]> {
    const rows = await this.operators.findMany(tenantId)
    return rows.map(toPublic)
  }

  async get(tenantId: string, id: string): Promise<Operator> {
    return toPublic(await this.require(tenantId, id))
  }

  // Com PIN: entra hoje. Sem PIN (só e-mail): recebe o link de primeiro
  // acesso e só aparece no Login depois de definir o PIN.
  async create(tenantId: string, input: CreateOperatorInput): Promise<Operator> {
    const email = input.email ?? null
    if (email) await this.assertEmailAvailable(tenantId, email)
    const row = await this.operators.create(tenantId, {
      name: input.name,
      role: input.role,
      email,
      pinHash: input.pin ? await argon2.hash(input.pin) : null,
      photoUrl: input.photoUrl ?? null,
    })
    if (email && !input.pin) {
      await this.pinTokens.sendPinLink(tenantId, { ...row, pinHash: null })
    }
    return toPublic(row)
  }

  async update(tenantId: string, id: string, input: UpdateOperatorInput, actor: OperatorSession): Promise<Operator> {
    const current = await this.require(tenantId, id)
    const role = input.role ?? current.role
    const email = input.email === undefined ? current.email : input.email
    if (role === 'ADMIN' && !email) throw adminNeedsEmail()
    if (email && email !== current.email) await this.assertEmailAvailable(tenantId, email, id)

    const demoting = role !== 'ADMIN' && current.role === 'ADMIN'
    if (demoting) {
      if (actor.id === id) throw selfChange()
      if (current.active) await this.assertNotLastAdmin(tenantId)
    }
    return toPublic(await this.operators.update(tenantId, id, input))
  }

  async setPin(tenantId: string, id: string, pin: string): Promise<Operator> {
    await this.require(tenantId, id)
    return toPublic(await this.operators.setPin(tenantId, id, await argon2.hash(pin)))
  }

  // Admin reenvia o link (primeiro acesso ou reset) para quem tem e-mail.
  async sendPinLink(tenantId: string, id: string): Promise<void> {
    const current = await this.require(tenantId, id)
    if (!current.active) throw new ConflictError('OPERATOR_INACTIVE', 'Ative o operador antes de enviar o link.')
    await this.pinTokens.sendPinLink(tenantId, { ...current, pinHash: current.hasPin ? 'set' : null })
  }

  async setActive(tenantId: string, id: string, active: boolean, actor: OperatorSession): Promise<Operator> {
    const current = await this.require(tenantId, id)
    if (!active && current.active) {
      if (actor.id === id) throw selfChange()
      if (current.role === 'ADMIN') await this.assertNotLastAdmin(tenantId)
    }
    return toPublic(await this.operators.setActive(tenantId, id, active))
  }

  async remove(tenantId: string, id: string, actor: OperatorSession): Promise<void> {
    const current = await this.require(tenantId, id)
    if (actor.id === id) throw selfChange()
    if (current.role === 'ADMIN' && current.active) await this.assertNotLastAdmin(tenantId)
    await this.operators.softDelete(tenantId, id)
  }

  // LGPD (08-seguranca § 13): quem já excluiu comum (soft-delete) some da
  // lista principal — aqui é a única forma de o Administrador achar de
  // novo quem já saiu, pra atender um pedido de exclusão definitiva que
  // pode chegar bem depois do desligamento.
  async listDeleted(tenantId: string): Promise<DeletedOperator[]> {
    const rows = await this.operators.findDeleted(tenantId)
    return rows.map(toPublicDeleted)
  }

  // Zera name/photoUrl/pinHash — nunca apaga a linha (histórico de
  // Sale/CashSession continua íntegro). Irreversível: sem "desfazer".
  async anonymize(tenantId: string, id: string, actor: OperatorSession): Promise<void> {
    const current = await this.operators.findAnyById(tenantId, id)
    if (!current) throw operatorNotFound()
    if (!current.deletedAt) throw operatorNotDeleted()
    if (current.anonymizedAt) throw alreadyAnonymized()

    await this.storage.deletePhotoByUrl(current.photoUrl)
    try {
      await this.operators.anonymize(tenantId, id)
    } catch (error) {
      // Corrida entre o check acima e o update (ex.: duas chamadas
      // concorrentes) — mesmíssima causa, mesma mensagem 409.
      if (error instanceof OperatorNotEligibleForAnonymizationError) throw alreadyAnonymized()
      throw error
    }
    this.logger.log(`Operator ${id} personal data anonymized by admin ${actor.id}`)
  }

  private async require(tenantId: string, id: string): Promise<OperatorRow> {
    const row = await this.operators.findById(tenantId, id)
    if (!row) throw operatorNotFound()
    return row
  }

  // E-mail é único dentro do tenant (é a chave do "esqueci meu PIN").
  private async assertEmailAvailable(tenantId: string, email: string, exceptId?: string) {
    const existing = await this.operators.findByEmail(tenantId, email)
    if (existing && existing.id !== exceptId) throw emailInUse()
  }

  // 03-regras-negocio § Operadores: sempre ao menos 1 admin ativo no tenant.
  // Chamado só quando a ação tira um admin ativo de circulação.
  private async assertNotLastAdmin(tenantId: string) {
    if ((await this.operators.countActiveAdmins(tenantId)) <= 1) throw lastAdmin()
  }
}

// Nunca devolver a linha inteira (08-seguranca § 9).
function toPublic(row: OperatorRow): Operator {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    email: row.email,
    hasPin: row.hasPin,
    active: row.active,
    photoUrl: row.photoUrl,
    createdAt: row.createdAt.toISOString(),
  }
}

// role/hasPin/active não fazem sentido pra alguém já excluído — só o
// necessário pra decidir se ainda dá pra anonimizar (deletedAt sempre
// presente aqui; anonymizedAt indica se já foi feito).
function toPublicDeleted(row: OperatorRow): DeletedOperator {
  return {
    id: row.id,
    name: row.name,
    photoUrl: row.photoUrl,
    deletedAt: (row.deletedAt as Date).toISOString(),
    anonymizedAt: row.anonymizedAt ? row.anonymizedAt.toISOString() : null,
  }
}
