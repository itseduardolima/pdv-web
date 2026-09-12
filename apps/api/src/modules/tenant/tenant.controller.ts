import { Controller, Get } from '@nestjs/common'
import type { PublicTenant } from '@pdv/shared'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { TenantService } from './tenant.service'

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenants: TenantService) {}

  // Público: o apps/web precisa do tema antes de qualquer login.
  @Public()
  @Get('current')
  getCurrent(@CurrentTenant() tenantId: string): Promise<PublicTenant> {
    return this.tenants.getCurrent(tenantId)
  }
}
