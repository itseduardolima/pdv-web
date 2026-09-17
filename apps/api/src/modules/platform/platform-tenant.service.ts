import { Inject, Injectable } from '@nestjs/common'
import {
  RESERVED_TENANT_SLUGS,
  type CreatePlatformTenantInput,
  type PlatformTenant,
  type PlatformTenantListQuery,
  type PlatformTenantPage,
} from '@pdv/shared'
import type { Prisma } from '@prisma/client'
import { ConflictError, DomainError, NotFoundError } from '../../common/errors/domain.error'
import { tenantStorage } from '../../common/tenant-context'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'
import { PinTokenService } from '../auth/pin-token.service'
import { TenantService } from '../tenant/tenant.service'
import { provisionTenant } from '../tenant/tenant-provisioning'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

interface TenantRow {
  id: string
  slug: string
  name: string
  domain: string | null
  createdAt: Date
  active: boolean
}

// Mesmo formato do 400 VALIDATION do pipe Zod, pra cair embaixo do campo na
// tela (mesmo padrão de operator.service.ts § adminNeedsEmail).
const reservedSlug = () =>
  new DomainError('VALIDATION', 'Dados inválidos.', 400, {
    formErrors: [],
    fieldErrors: { slug: ['Esse identificador é reservado — escolha outro.'] },
  })
const slugInUse = () => new ConflictError('SLUG_IN_USE', 'Já existe uma loja com esse identificador.')
const adminEmailInUse = () =>
  new DomainError('VALIDATION', 'Dados inválidos.', 400, {
    formErrors: [],
    fieldErrors: { adminEmail: ['Esse e-mail já é usado pelo administrador de outra loja.'] },
  })

@Injectable()
export class PlatformTenantService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaService,
    private readonly tenants: TenantService,
    private readonly pinTokens: PinTokenService,
  ) {}

  async create(input: CreatePlatformTenantInput): Promise<PlatformTenant> {
    if ((RESERVED_TENANT_SLUGS as readonly string[]).includes(input.slug)) throw reservedSlug()

    const existing = await this.prisma.tenant.findUnique({ where: { slug: input.slug } })
    if (existing) throw slugInUse()

    if (await this.isAdminEmailInUse(input.adminEmail)) throw adminEmailInUse()

    // provisionTenant recebe o PrismaClient "puro" (mesma função usada pelo
    // seed.ts, fora de contexto de request) — o client estendido por RLS
    // (PrismaService) é estruturalmente compatível para as chamadas usadas.
    // Sem `pin`: o admin nasce sem PIN, e o link de primeiro acesso abaixo
    // é quem deixa ele definir o próprio.
    const { tenant, createdAdmin } = await provisionTenant(
      this.prisma as unknown as Parameters<typeof provisionTenant>[0],
      { slug: input.slug, name: input.name, primaryColor: input.primaryColor ?? undefined },
      { name: input.adminName, email: input.adminEmail },
    )

    // Só quando um admin novo foi de fato criado agora (nunca reenvia link
    // pra um admin que já existia — mesma idempotência do upsert de tenant).
    // PinToken tem RLS (FORCE ROW LEVEL SECURITY) — sem tenantStorage.run
    // aqui, o insert do token é recusado pelo Postgres (42501): a requisição
    // do painel não passa pelo TenantMiddleware, então não há app.tenant_id
    // setado por padrão (mesmo achado de countActiveOperators). O await
    // precisa estar DENTRO do callback, senão o contexto se perde antes da
    // query rodar de verdade.
    if (createdAdmin) {
      await tenantStorage.run({ tenantId: tenant.id }, async () => {
        await this.pinTokens.sendPinLink(tenant.id, { ...createdAdmin, active: true, deletedAt: null })
      })
    }

    const activeOperatorCount = await this.countActiveOperators(tenant.id)
    return this.toPublic(tenant, activeOperatorCount)
  }

  async list(query: PlatformTenantListQuery): Promise<PlatformTenantPage> {
    const where: Prisma.TenantWhereInput = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { slug: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}

    // Busca TODAS as lojas que batem no filtro (não só a página pedida): os
    // KPIs (totalOperators/newLast30Days) precisam somar sobre o conjunto
    // inteiro, senão trocariam de valor a cada página virada.
    const matching = await this.prisma.tenant.findMany({ where, orderBy: { createdAt: 'desc' } })

    // Operator tem Row-Level Security por tenant (FORCE ROW LEVEL SECURITY) —
    // uma query sem app.tenant_id setado não enxerga NADA, de propósito
    // (08-seguranca § 1). Uma requisição do painel não tem tenant nenhum no
    // contexto (platform/* fica fora do TenantMiddleware), então a contagem
    // por loja precisa declarar o tenant explicitamente, uma de cada vez —
    // é a exceção deliberada em que o superadmin "entra" no escopo de cada
    // tenant só para essa leitura agregada, nunca pra ver dado operacional.
    const operatorCounts = await Promise.all(matching.map((tenant) => this.countActiveOperators(tenant.id)))
    const rows = matching.map((tenant, index) => ({ tenant, activeOperatorCount: operatorCounts[index] ?? 0 }))

    const now = Date.now()
    const totalOperators = operatorCounts.reduce((sum, count) => sum + count, 0)
    const newLast30Days = matching.filter((tenant) => now - tenant.createdAt.getTime() <= THIRTY_DAYS_MS).length

    const start = (query.page - 1) * query.pageSize
    const pageRows = rows.slice(start, start + query.pageSize)

    return {
      items: pageRows.map((row) => this.toPublic(row.tenant, row.activeOperatorCount)),
      total: matching.length,
      page: query.page,
      pageSize: query.pageSize,
      totalOperators,
      newLast30Days,
    }
  }

  // HU 13.7: suspender/reativar não apaga nenhum dado, só troca o campo —
  // limpa o cache de host do TenantService pra "reativar restaura o acesso
  // na hora" valer de verdade (sem isso, o host ficaria até
  // TENANT_CACHE_TTL_MS preso no valor antigo).
  async setActive(id: string, active: boolean): Promise<PlatformTenant> {
    const existing = await this.prisma.tenant.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('TENANT_NOT_FOUND', 'Loja não encontrada.')

    const tenant = await this.prisma.tenant.update({ where: { id }, data: { active } })
    this.tenants.clearHostCache()

    const activeOperatorCount = await this.countActiveOperators(tenant.id)
    return this.toPublic(tenant, activeOperatorCount)
  }

  // Operator.email é único só por tenant (@@unique([tenantId, email])) — de
  // propósito, pois duas lojas de negócios diferentes podem coincidir de
  // e-mail em geral. Mas o e-mail do administrador criado pelo painel
  // Superadmin identifica quem é dono/gestor da loja perante o revendedor:
  // o mesmo e-mail em duas lojas diferentes indicaria a mesma pessoa
  // administrando duas contas, o que o painel não deveria permitir sem
  // querer. Checa tenant por tenant (mesma exceção de countActiveOperators).
  private async isAdminEmailInUse(email: string): Promise<boolean> {
    const tenants = await this.prisma.tenant.findMany({ select: { id: true } })
    for (const tenant of tenants) {
      const found = await tenantStorage.run({ tenantId: tenant.id }, async () => {
        return this.prisma.operator.findFirst({ where: { tenantId: tenant.id, email, deletedAt: null } })
      })
      if (found) return true
    }
    return false
  }

  private countActiveOperators(tenantId: string): Promise<number> {
    // O await é obrigatório AQUI DENTRO do callback do run() — devolver a
    // PrismaPromise sem awaitar (`() => this.prisma.operator.count(...)`)
    // perde o contexto do AsyncLocalStorage antes da query rodar de verdade
    // (a extensão de RLS vê tenantId undefined). Confirmado na prática
    // durante a implementação desta função.
    return tenantStorage.run({ tenantId }, async () => {
      const count = await this.prisma.operator.count({ where: { tenantId, active: true, deletedAt: null } })
      return count
    })
  }

  private toPublic(tenant: TenantRow, activeOperatorCount: number): PlatformTenant {
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      domain: tenant.domain,
      createdAt: tenant.createdAt.toISOString(),
      activeOperatorCount,
      active: tenant.active,
    }
  }
}
