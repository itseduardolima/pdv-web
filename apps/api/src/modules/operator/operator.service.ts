import { Injectable } from '@nestjs/common'
import argon2 from 'argon2'
import type { CreateOperatorInput, Operator, UpdateOperatorInput } from '@pdv/shared'
import { ConflictError, NotFoundError } from '../../common/errors/domain.error'
import type { OperatorSession } from '../../common/types/request'
import { OperatorRepository, type OperatorRow } from './operator.repository'

const operatorNotFound = () => new NotFoundError('OPERATOR_NOT_FOUND', 'Operador não encontrado.')
const lastAdmin = () =>
  new ConflictError('LAST_ADMIN', 'Este é o único Administrador ativo da loja. Promova outro antes.')
const selfChange = () =>
  new ConflictError('SELF_CHANGE', 'Você não pode inativar, rebaixar ou excluir a sua própria conta.')

@Injectable()
export class OperatorService {
  constructor(private readonly operators: OperatorRepository) {}

  async list(tenantId: string): Promise<Operator[]> {
    const rows = await this.operators.findMany(tenantId)
    return rows.map(toPublic)
  }

  async get(tenantId: string, id: string): Promise<Operator> {
    return toPublic(await this.require(tenantId, id))
  }

  async create(tenantId: string, input: CreateOperatorInput): Promise<Operator> {
    const pinHash = await argon2.hash(input.pin)
    const row = await this.operators.create(tenantId, {
      name: input.name,
      role: input.role,
      pinHash,
      photoUrl: input.photoUrl ?? null,
    })
    return toPublic(row)
  }

  async update(tenantId: string, id: string, input: UpdateOperatorInput, actor: OperatorSession): Promise<Operator> {
    const current = await this.require(tenantId, id)
    const demoting = input.role !== undefined && input.role !== 'ADMIN' && current.role === 'ADMIN'
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
    active: row.active,
    photoUrl: row.photoUrl,
    createdAt: row.createdAt.toISOString(),
  }
}
