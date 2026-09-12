import { Inject, Injectable } from '@nestjs/common'
import type { Operator } from '@prisma/client'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'

export type LoginOperatorRow = Pick<Operator, 'id' | 'name' | 'photoUrl'>
export type SessionOperatorRow = Pick<Operator, 'id' | 'name' | 'role' | 'photoUrl'>
export type OperatorForLogin = SessionOperatorRow & Pick<Operator, 'pinHash' | 'active' | 'deletedAt'>

@Injectable()
export class AuthRepository {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  // Só o necessário para a tela de Login: nunca role nem pinHash.
  findActiveOperators(tenantId: string): Promise<LoginOperatorRow[]> {
    return this.prisma.operator.findMany({
      where: { tenantId, active: true, deletedAt: null },
      select: { id: true, name: true, photoUrl: true },
      orderBy: { name: 'asc' },
    })
  }

  // Único lugar que lê pinHash; o Service compara e descarta.
  findOperatorForLogin(tenantId: string, operatorId: string): Promise<OperatorForLogin | null> {
    return this.prisma.operator.findFirst({
      where: { tenantId, id: operatorId },
      select: { id: true, name: true, role: true, photoUrl: true, pinHash: true, active: true, deletedAt: true },
    })
  }

  findSessionOperator(tenantId: string, operatorId: string): Promise<SessionOperatorRow | null> {
    return this.prisma.operator.findFirst({
      where: { tenantId, id: operatorId, active: true, deletedAt: null },
      select: { id: true, name: true, role: true, photoUrl: true },
    })
  }
}
