import { Inject, Injectable } from '@nestjs/common'
import type { Tenant } from '@prisma/client'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'

export interface TenantPatch {
  name: string
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  timezone: string
  // Sempre nulo aqui: força o recálculo do contraste pela cor nova em getCurrent.
  primaryInkColor: null
}

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

  update(id: string, data: TenantPatch): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data })
  }
}
