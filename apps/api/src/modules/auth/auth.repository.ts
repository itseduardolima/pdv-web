import { Inject, Injectable } from '@nestjs/common'
import type { Operator, PinToken, PinTokenPurpose } from '@prisma/client'
import { PRISMA, setTenantInTransaction, type PrismaService } from '../../prisma/prisma.client'

export type LoginOperatorRow = Pick<Operator, 'id' | 'name' | 'photoUrl'>
export type SessionOperatorRow = Pick<Operator, 'id' | 'name' | 'role' | 'photoUrl'>
export type OperatorForLogin = SessionOperatorRow & Pick<Operator, 'pinHash' | 'active' | 'deletedAt'>
export type OperatorForPinLink = Pick<Operator, 'id' | 'name' | 'email' | 'pinHash' | 'active' | 'deletedAt'>
export type PinTokenRow = PinToken & { operator: Pick<Operator, 'id' | 'name' | 'active' | 'deletedAt'> }

export interface NewPinToken {
  operatorId: string
  tokenHash: string
  purpose: PinTokenPurpose
  expiresAt: Date
}

@Injectable()
export class AuthRepository {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  // Só o necessário para a tela de Login: nunca role nem pinHash. Quem ainda
  // não definiu o PIN (primeiro acesso pendente) não aparece.
  findActiveOperators(tenantId: string): Promise<LoginOperatorRow[]> {
    return this.prisma.operator.findMany({
      where: { tenantId, active: true, deletedAt: null, pinHash: { not: null } },
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

  findOperatorByEmail(tenantId: string, email: string): Promise<OperatorForPinLink | null> {
    return this.prisma.operator.findFirst({
      where: { tenantId, email },
      select: { id: true, name: true, email: true, pinHash: true, active: true, deletedAt: true },
    })
  }

  findOperatorForPinLink(tenantId: string, operatorId: string): Promise<OperatorForPinLink | null> {
    return this.prisma.operator.findFirst({
      where: { tenantId, id: operatorId, deletedAt: null },
      select: { id: true, name: true, email: true, pinHash: true, active: true, deletedAt: true },
    })
  }

  // Host público da loja, para montar o link do e-mail.
  async findTenantHost(tenantId: string, baseDomain: string): Promise<string | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, domain: true },
    })
    if (!tenant) return null
    return tenant.domain ?? `${tenant.slug}.${baseDomain}`
  }

  // Um link vivo por operador: emitir um novo invalida os anteriores.
  async createPinToken(tenantId: string, data: NewPinToken): Promise<PinToken> {
    await this.prisma.pinToken.updateMany({
      where: { tenantId, operatorId: data.operatorId, usedAt: null },
      data: { usedAt: new Date() },
    })
    return this.prisma.pinToken.create({ data: { ...data, tenantId } })
  }

  findPinToken(tenantId: string, tokenHash: string): Promise<PinTokenRow | null> {
    return this.prisma.pinToken.findFirst({
      where: { tenantId, tokenHash },
      include: { operator: { select: { id: true, name: true, active: true, deletedAt: true } } },
    })
  }

  // Define o PIN e queima o token na mesma transação.
  async consumePinToken(tenantId: string, tokenId: string, operatorId: string, pinHash: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await setTenantInTransaction(tx, tenantId)
      await tx.pinToken.update({ where: { id: tokenId, tenantId }, data: { usedAt: new Date() } })
      await tx.operator.update({ where: { id: operatorId, tenantId }, data: { pinHash } })
    })
  }
}
