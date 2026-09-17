import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Tenant } from '@prisma/client'
import type { PublicTenant, UpdateTenantInput } from '@pdv/shared'
import { ConflictError, NotFoundError } from '../../common/errors/domain.error'
import { TenantResolver } from '../../common/tenant-context'
import { contrastInkColor } from '../../common/utils/contrast-ink-color'
import { parseTenantHost } from './tenant-host'
import { TenantRepository } from './tenant.repository'

interface CacheEntry {
  tenantId: string | null
  active: boolean
  expiresAt: number
}

@Injectable()
export class TenantService extends TenantResolver {
  private readonly baseDomain: string
  private readonly cacheTtlMs: number
  // Cache só de host → id: o tema é sempre lido fresco em getCurrent, então
  // trocar cor/nome no banco reflete na próxima request sem esperar o TTL.
  private readonly cache = new Map<string, CacheEntry>()

  constructor(
    private readonly tenants: TenantRepository,
    config: ConfigService,
  ) {
    super()
    this.baseDomain = config.get<string>('APP_BASE_DOMAIN', 'app.localhost')
    this.cacheTtlMs = Number(config.get<string | number>('TENANT_CACHE_TTL_MS', 60_000))
  }

  async resolveByHost(rawHost: string): Promise<{ id: string; active: boolean } | null> {
    const { host, slug } = parseTenantHost(rawHost, this.baseDomain)

    const cached = this.cache.get(host)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tenantId ? { id: cached.tenantId, active: cached.active } : null
    }

    const tenant = (await this.tenants.findByDomain(host)) ?? (slug ? await this.tenants.findBySlug(slug) : null)

    this.cache.set(host, {
      tenantId: tenant?.id ?? null,
      active: tenant?.active ?? true,
      expiresAt: Date.now() + this.cacheTtlMs,
    })
    return tenant ? { id: tenant.id, active: tenant.active } : null
  }

  // Chamado pelo painel Superadmin ao suspender/reativar uma loja (HU 13.7):
  // sem isso, o host ficaria até `TENANT_CACHE_TTL_MS` preso no valor antigo
  // de `active` — "reativar restaura o acesso na hora" não seria verdade.
  clearHostCache(): void {
    this.cache.clear()
  }

  async getCurrent(tenantId: string): Promise<PublicTenant> {
    const tenant = await this.tenants.findById(tenantId)
    if (!tenant) throw new NotFoundError('TENANT_NOT_FOUND', 'Loja não encontrada.')
    return this.toPublic(tenant)
  }

  // HU 11.1–11.4: slug/domain são imutáveis (quebrariam URL/DNS), por isso
  // não vêm no schema de update; primaryInkColor nunca é aceito do form —
  // volta a nulo pra ser recalculado pela cor nova na próxima leitura.
  async updateCurrent(tenantId: string, input: UpdateTenantInput): Promise<PublicTenant> {
    const tenant = await this.tenants.findById(tenantId)
    if (!tenant) throw new NotFoundError('TENANT_NOT_FOUND', 'Loja não encontrada.')
    const patch = { ...input, primaryInkColor: null }

    // Só reduzindo é que precisa checar (e paga o custo da transação) — o
    // check e a gravação acontecem juntos pra não deixar uma abertura de
    // caixa concorrente escapar entre os dois passos.
    if (input.registerCount < tenant.registerCount) {
      const { tenant: updated, conflictRegister } = await this.tenants.updateIfNoRegisterAbove(
        tenantId,
        patch,
        input.registerCount,
      )
      if (conflictRegister !== null) {
        throw new ConflictError(
          'REGISTER_IN_USE',
          `O Caixa ${conflictRegister} está aberto agora — feche-o antes de reduzir a quantidade de caixas.`,
          { registerNumber: conflictRegister },
        )
      }
      return this.toPublic(updated)
    }

    const updated = await this.tenants.update(tenantId, patch)
    return this.toPublic(updated)
  }

  private toPublic(tenant: Tenant): PublicTenant {
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      logoUrl: tenant.logoUrl,
      primaryColor: tenant.primaryColor,
      primaryInkColor: tenant.primaryInkColor ?? contrastInkColor(tenant.primaryColor),
      accentColor: tenant.accentColor,
      timezone: tenant.timezone,
      registerCount: tenant.registerCount,
    }
  }
}
