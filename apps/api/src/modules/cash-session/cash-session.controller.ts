import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import {
  cashSessionSummarySchema,
  currentCashSessionSchema,
  openCashSessionSchema,
  saleSchema,
  type CashSessionSummary,
  type CurrentCashSession,
  type Sale,
} from '@pdv/shared'
import { z } from 'zod'
import { CurrentOperator } from '../../common/decorators/current-operator.decorator'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { SESSION_COOKIE, type OperatorSession } from '../../common/types/request'
import { CashSessionService } from './cash-session.service'
import { OpenCashSessionDto } from './dto/open-cash-session.dto'

@ApiTags('cash-sessions')
@ApiCookieAuth(SESSION_COOKIE)
@Controller('cash-sessions')
export class CashSessionController {
  constructor(private readonly sessions: CashSessionService) {}

  @Get('current')
  @ApiOkResponse({ schema: openApi(currentCashSessionSchema), description: 'Caixa aberto com totais ao vivo, ou { session: null }' })
  async getCurrent(@CurrentTenant() tenantId: string): Promise<CurrentCashSession> {
    return { session: await this.sessions.getCurrent(tenantId) }
  }

  @Post()
  @ApiBody({ schema: openApi(openCashSessionSchema) })
  @ApiCreatedResponse({ schema: openApi(cashSessionSummarySchema) })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION' })
  @ApiConflictResponse({ schema: apiErrorOpenApi, description: 'CASH_SESSION_ALREADY_OPEN' })
  open(
    @CurrentTenant() tenantId: string,
    @CurrentOperator() operator: OperatorSession,
    @Body() body: OpenCashSessionDto,
  ): Promise<CashSessionSummary> {
    return this.sessions.open(tenantId, operator, body)
  }

  @Get(':id')
  @ApiOkResponse({ schema: openApi(cashSessionSummarySchema) })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'CASH_SESSION_NOT_FOUND' })
  get(@CurrentTenant() tenantId: string, @Param('id') id: string): Promise<CashSessionSummary> {
    return this.sessions.get(tenantId, id)
  }

  @Post(':id/close')
  @HttpCode(200)
  @ApiOkResponse({ schema: openApi(cashSessionSummarySchema), description: 'Sessão fechada com totais por forma de pagamento' })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'CASH_SESSION_NOT_FOUND' })
  @ApiConflictResponse({ schema: apiErrorOpenApi, description: 'CASH_SESSION_ALREADY_CLOSED' })
  @ApiForbiddenResponse({ schema: apiErrorOpenApi, description: 'NOT_CASH_SESSION_OWNER' })
  close(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentOperator() operator: OperatorSession,
  ): Promise<CashSessionSummary> {
    return this.sessions.close(tenantId, id, operator)
  }

  @Get(':id/sales')
  @ApiOkResponse({ schema: openApi(z.array(saleSchema)), description: 'Histórico de vendas da sessão (mais recente primeiro)' })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'CASH_SESSION_NOT_FOUND' })
  listSales(@CurrentTenant() tenantId: string, @Param('id') id: string): Promise<Sale[]> {
    return this.sessions.listSales(tenantId, id)
  }
}
