import { Body, Controller, Get, Patch, Query } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { publicTenantSchema, updateTenantSchema, type PublicTenant } from '@pdv/shared'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { NotFoundError } from '../../common/errors/domain.error'
import { Public } from '../../common/decorators/public.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { SESSION_COOKIE } from '../../common/types/request'
import { UpdateTenantDto } from './dto/update-tenant.dto'
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

  // HU 11.1–11.4 (Configurações da Loja): slug/domain não entram no DTO —
  // são imutáveis, quebrariam URL/DNS se trocados.
  @Patch('current')
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiForbiddenResponse({ schema: apiErrorOpenApi, description: 'ADMIN_ONLY' })
  @Roles('ADMIN')
  @ApiBody({ schema: openApi(updateTenantSchema) })
  @ApiOkResponse({ schema: openApi(publicTenantSchema) })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION — details.fieldErrors por campo' })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'TENANT_NOT_FOUND' })
  @ApiConflictResponse({
    schema: apiErrorOpenApi,
    description: 'REGISTER_IN_USE (details.registerNumber) — reduzir registerCount com aquele caixa aberto',
  })
  updateCurrent(@CurrentTenant() tenantId: string, @Body() body: UpdateTenantDto): Promise<PublicTenant> {
    return this.tenants.updateCurrent(tenantId, body)
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
