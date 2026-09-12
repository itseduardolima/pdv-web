import { Controller, Get, Query } from '@nestjs/common'
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { publicTenantSchema, type PublicTenant } from '@pdv/shared'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { NotFoundError } from '../../common/errors/domain.error'
import { Public } from '../../common/decorators/public.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { TenantService } from './tenant.service'

@ApiTags('tenant')
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenants: TenantService) {}

  // Público: o apps/web precisa do tema antes de qualquer login.
  @Public()
  @Get('current')
  @ApiOkResponse({ schema: openApi(publicTenantSchema), description: 'Nome, logo e cores da loja resolvida pelo host' })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'TENANT_NOT_FOUND' })
  getCurrent(@CurrentTenant() tenantId: string): Promise<PublicTenant> {
    return this.tenants.getCurrent(tenantId)
  }

  // Chamado pelo Caddy (on_demand_tls ask) antes de emitir certificado: só
  // hosts de tenant conhecido ganham TLS — evita emissão para qualquer nome.
  @Public()
  @Get('tls-check')
  @ApiExcludeEndpoint()
  async tlsCheck(@Query('domain') domain: string | undefined): Promise<{ ok: true }> {
    const tenant = domain ? await this.tenants.resolveByHost(domain) : null
    if (!tenant) throw new NotFoundError('TENANT_NOT_FOUND', 'Loja não encontrada para este endereço.')
    return { ok: true }
  }
}
