import { Injectable } from '@nestjs/common'
import argon2 from 'argon2'
import {
  ADMIN_EMAIL_REQUIRED_MESSAGE,
  type CreateOperatorInput,
  type Operator,
  type UpdateOperatorInput,
} from '@pdv/shared'
import { ConflictError, DomainError, NotFoundError } from '../../common/errors/domain.error'
import type { OperatorSession } from '../../common/types/request'
import { PinTokenService } from '../auth/pin-token.service'
import { OperatorRepository, type OperatorRow } from './operator.repository'

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

@Injectable()
export class OperatorService {
  constructor(
    private readonly operators: OperatorRepository,
    private readonly pinTokens: PinTokenService,
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
