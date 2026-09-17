import { Inject, Injectable } from '@nestjs/common'
import type { PlatformAdmin } from '@prisma/client'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'

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
}
