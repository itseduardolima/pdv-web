import { Inject, Injectable } from '@nestjs/common'
import type { Tenant } from '@prisma/client'
import { PRISMA, setTenantInTransaction, type PrismaService } from '../../prisma/prisma.client'

export interface TenantPatch {
  name: string
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  timezone: string
  registerCount: number
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

  // HU 11.6: reduzir registerCount não pode deixar de fora um caixa com
  // sessão aberta agora. Checa o maior registerNumber aberto e grava dentro
  // da MESMA transação (em vez de duas chamadas separadas) — fecha a janela
  // em que uma abertura de caixa concorrente poderia passar despercebida
  // entre o check e o update.
  async updateIfNoRegisterAbove(
    tenantId: string,
    data: TenantPatch,
    newRegisterCount: number,
  ): Promise<{ tenant: Tenant; conflictRegister: number | null }> {
    return this.prisma.$transaction(async (tx) => {
      await setTenantInTransaction(tx, tenantId)
      const openRow = await tx.cashSession.findFirst({
        where: { tenantId, closedAt: null },
        orderBy: { registerNumber: 'desc' },
        select: { registerNumber: true },
      })
      const maxOpen = openRow?.registerNumber ?? null
      if (maxOpen !== null && maxOpen > newRegisterCount) {
        const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: tenantId } })
        return { tenant, conflictRegister: maxOpen }
      }
      const tenant = await tx.tenant.update({ where: { id: tenantId }, data })
      return { tenant, conflictRegister: null }
    })
  }
}
