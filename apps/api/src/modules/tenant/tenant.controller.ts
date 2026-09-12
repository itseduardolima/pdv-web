import { Controller, Get } from '@nestjs/common'
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { publicTenantSchema, type PublicTenant } from '@pdv/shared'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
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
}
