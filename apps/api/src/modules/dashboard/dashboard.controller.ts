import { Controller, Get } from '@nestjs/common'
import { ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { dashboardSummarySchema, type DashboardSummary } from '@pdv/shared'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { SESSION_COOKIE } from '../../common/types/request'
import { DashboardService } from './dashboard.service'

// Dashboard é de Administrador (03-regras-negocio § Papéis).
@ApiTags('dashboard')
@ApiCookieAuth(SESSION_COOKIE)
@Roles('ADMIN')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  @ApiOkResponse({
    schema: openApi(dashboardSummarySchema),
    description: 'Hoje (total, por forma de pagamento, mais vendidos) e últimos 7 dias, no fuso da loja',
  })
  @ApiForbiddenResponse({ schema: apiErrorOpenApi, description: 'ADMIN_ONLY' })
  summary(@CurrentTenant() tenantId: string): Promise<DashboardSummary> {
    return this.dashboard.summary(tenantId)
  }
}
