import { Inject, Injectable } from '@nestjs/common'
import type { Operator, OperatorRole } from '@prisma/client'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'

// pinHash nunca sai do Repository: só entra (create / setPin). Sai apenas
// `hasPin`, para a tela saber se o primeiro acesso está pendente.
export type OperatorRow = Omit<Operator, 'pinHash'> & { hasPin: boolean }
const publicSelect = {
  id: true,
  tenantId: true,
  name: true,
  role: true,
  email: true,
  active: true,
  photoUrl: true,
  createdAt: true,
  deletedAt: true,
} as const

export interface NewOperator {
  name: string
  role: OperatorRole
  email: string | null
  pinHash: string | null
  photoUrl: string | null
}

export interface OperatorPatch {
  name?: string
  role?: OperatorRole
  email?: string | null
  photoUrl?: string | null
}

@Injectable()
export class OperatorRepository {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  // Inclui inativos (a tela de gestão mostra o toggle); exclui só os removidos.
  async findMany(tenantId: string): Promise<OperatorRow[]> {
    const rows = await this.prisma.operator.findMany({
      where: { tenantId, deletedAt: null },
      select: rowSelect,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    })
    return rows.map(toRow)
  }

  async findById(tenantId: string, id: string): Promise<OperatorRow | null> {
    const row = await this.prisma.operator.findFirst({ where: { tenantId, id, deletedAt: null }, select: rowSelect })
    return row ? toRow(row) : null
  }

  async findByEmail(tenantId: string, email: string): Promise<OperatorRow | null> {
    const row = await this.prisma.operator.findFirst({ where: { tenantId, email }, select: rowSelect })
    return row ? toRow(row) : null
  }

  countActiveAdmins(tenantId: string): Promise<number> {
    return this.prisma.operator.count({ where: { tenantId, role: 'ADMIN', active: true, deletedAt: null } })
  }

  async create(tenantId: string, data: NewOperator): Promise<OperatorRow> {
    return toRow(await this.prisma.operator.create({ data: { ...data, tenantId }, select: rowSelect }))
  }

  async update(tenantId: string, id: string, data: OperatorPatch): Promise<OperatorRow> {
    return toRow(await this.prisma.operator.update({ where: { id, tenantId }, data, select: rowSelect }))
  }

  async setPin(tenantId: string, id: string, pinHash: string): Promise<OperatorRow> {
    return toRow(await this.prisma.operator.update({ where: { id, tenantId }, data: { pinHash }, select: rowSelect }))
  }

  async setActive(tenantId: string, id: string, active: boolean): Promise<OperatorRow> {
    return toRow(await this.prisma.operator.update({ where: { id, tenantId }, data: { active }, select: rowSelect }))
  }

  // Soft-delete: Sale/CashSession continuam apontando para o operador. O
  // e-mail é liberado para um cadastro novo (unique por tenant).
  async softDelete(tenantId: string, id: string): Promise<OperatorRow> {
    return toRow(
      await this.prisma.operator.update({
        where: { id, tenantId },
        data: { deletedAt: new Date(), active: false, email: null },
        select: rowSelect,
      }),
    )
  }
}

// Só lê se o hash existe; o valor nunca chega ao Service.
const rowSelect = { ...publicSelect, pinHash: true } as const
type RawRow = Omit<Operator, 'pinHash'> & { pinHash: string | null }

function toRow({ pinHash, ...row }: RawRow): OperatorRow {
  return { ...row, hasPin: pinHash !== null }
}
