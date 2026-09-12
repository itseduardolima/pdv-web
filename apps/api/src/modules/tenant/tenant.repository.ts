import { Inject, Injectable } from '@nestjs/common'
import type { Tenant } from '@prisma/client'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'

// Único repositório sem filtro de tenantId: aqui o Tenant é a própria entidade
// que define o escopo — os demais repositórios recebem o id resolvido daqui.
@Injectable()
export class TenantRepository {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  findByDomain(domain: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { domain } })
  }

  findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } })
  }

  findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } })
  }
}
