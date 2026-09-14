import { Controller, Get, Query } from '@nestjs/common'
import { ApiBadRequestResponse, ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { reportSummarySchema, type ReportSummary } from '@pdv/shared'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { SESSION_COOKIE } from '../../common/types/request'
import { ReportSummaryQueryDto } from './dto/report-summary-query.dto'
import { ReportsService } from './reports.service'

// Relatórios é de Administrador (03-regras-negocio § Papéis, mesmo padrão do Dashboard).
@ApiTags('reports')
@ApiCookieAuth(SESSION_COOKIE)
@Roles('ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('summary')
  @ApiOkResponse({
    schema: openApi(reportSummarySchema),
    description: 'Total, forma de pagamento, produtos, operadores e produtos parados no período, no fuso da loja',
  })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION (period=custom exige from/to válidos)' })
  @ApiForbiddenResponse({ schema: apiErrorOpenApi, description: 'ADMIN_ONLY' })
  summary(@CurrentTenant() tenantId: string, @Query() query: ReportSummaryQueryDto): Promise<ReportSummary> {
    return this.reports.summary(tenantId, query)
  }
}
