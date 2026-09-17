import { Inject, Injectable } from '@nestjs/common'
import type { PlatformAdmin, PlatformAdminResetToken } from '@prisma/client'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'

export type ResetTokenRow = PlatformAdminResetToken & { platformAdmin: Pick<PlatformAdmin, 'id' | 'name' | 'email'> }

export interface NewResetToken {
  platformAdminId: string
  tokenHash: string
  expiresAt: Date
}

// Sem filtro de tenantId, de propósito — mesma exceção documentada em
// TenantRepository (tenant.repository.ts): PlatformAdmin fica fora do
// isolamento por loja.
@Injectable()
export class PlatformAdminRepository {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<PlatformAdmin | null> {
    return this.prisma.platformAdmin.findUnique({ where: { email } })
  }

  findById(id: string): Promise<PlatformAdmin | null> {
    return this.prisma.platformAdmin.findUnique({ where: { id } })
  }

  update(id: string, data: { name?: string; email?: string; passwordHash?: string }): Promise<PlatformAdmin> {
    return this.prisma.platformAdmin.update({ where: { id }, data })
  }

  // Emitir um link novo invalida qualquer token não usado do mesmo admin —
  // mesmo comportamento de AuthRepository.createPinToken.
  async createResetToken(data: NewResetToken): Promise<PlatformAdminResetToken> {
    await this.prisma.platformAdminResetToken.updateMany({
      where: { platformAdminId: data.platformAdminId, usedAt: null },
      data: { usedAt: new Date() },
    })
    return this.prisma.platformAdminResetToken.create({ data })
  }

  findResetToken(tokenHash: string): Promise<ResetTokenRow | null> {
    return this.prisma.platformAdminResetToken.findUnique({
      where: { tokenHash },
      include: { platformAdmin: { select: { id: true, name: true, email: true } } },
    })
  }

  // Define a senha nova e queima o token na mesma transação. Sem tenant
  // aqui — PlatformAdmin fica fora de RLS, não precisa de setTenantInTransaction.
  async consumeResetToken(tokenId: string, platformAdminId: string, passwordHash: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.platformAdminResetToken.update({ where: { id: tokenId }, data: { usedAt: new Date() } })
      await tx.platformAdmin.update({ where: { id: platformAdminId }, data: { passwordHash } })
    })
  }
}
