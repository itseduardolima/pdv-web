import { Inject, Injectable } from '@nestjs/common'
import type { Operator, OperatorRole } from '@prisma/client'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'

// pinHash nunca sai do Repository: só entra (create / setPin).
export type OperatorRow = Omit<Operator, 'pinHash'>
const publicSelect = {
  id: true,
  tenantId: true,
  name: true,
  role: true,
  active: true,
  photoUrl: true,
  createdAt: true,
  deletedAt: true,
} as const

export interface NewOperator {
  name: string
  role: OperatorRole
  pinHash: string
  photoUrl: string | null
}

export interface OperatorPatch {
  name?: string
  role?: OperatorRole
  photoUrl?: string | null
}

@Injectable()
export class OperatorRepository {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  // Inclui inativos (a tela de gestão mostra o toggle); exclui só os removidos.
  findMany(tenantId: string): Promise<OperatorRow[]> {
    return this.prisma.operator.findMany({
      where: { tenantId, deletedAt: null },
      select: publicSelect,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    })
  }

  findById(tenantId: string, id: string): Promise<OperatorRow | null> {
    return this.prisma.operator.findFirst({ where: { tenantId, id, deletedAt: null }, select: publicSelect })
  }

  countActiveAdmins(tenantId: string): Promise<number> {
    return this.prisma.operator.count({ where: { tenantId, role: 'ADMIN', active: true, deletedAt: null } })
  }

  create(tenantId: string, data: NewOperator): Promise<OperatorRow> {
    return this.prisma.operator.create({ data: { ...data, tenantId }, select: publicSelect })
  }

  update(tenantId: string, id: string, data: OperatorPatch): Promise<OperatorRow> {
    return this.prisma.operator.update({ where: { id, tenantId }, data, select: publicSelect })
  }

  setPin(tenantId: string, id: string, pinHash: string): Promise<OperatorRow> {
    return this.prisma.operator.update({ where: { id, tenantId }, data: { pinHash }, select: publicSelect })
  }

  setActive(tenantId: string, id: string, active: boolean): Promise<OperatorRow> {
    return this.prisma.operator.update({ where: { id, tenantId }, data: { active }, select: publicSelect })
  }

  // Soft-delete: Sale/CashSession continuam apontando para o operador.
  softDelete(tenantId: string, id: string): Promise<OperatorRow> {
    return this.prisma.operator.update({
      where: { id, tenantId },
      data: { deletedAt: new Date(), active: false },
      select: publicSelect,
    })
  }
}
