import { Body, Controller, Post } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger'
import { createSaleSchema, saleSchema, type Sale } from '@pdv/shared'
import { CurrentOperator } from '../../common/decorators/current-operator.decorator'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { SESSION_COOKIE, type OperatorSession } from '../../common/types/request'
import { CreateSaleDto } from './dto/create-sale.dto'
import { SaleService } from './sale.service'

@ApiTags('sales')
@ApiCookieAuth(SESSION_COOKIE)
@Controller('sales')
export class SaleController {
  constructor(private readonly sales: SaleService) {}

  @Post()
  @ApiBody({ schema: openApi(createSaleSchema) })
  @ApiCreatedResponse({
    schema: openApi(saleSchema),
    description: 'Venda registrada (ou a já existente, se o uuid se repetir)',
  })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION' })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'PRODUCT_NOT_FOUND (details.productId)' })
  @ApiConflictResponse({
    schema: apiErrorOpenApi,
    description: 'CASH_SESSION_NOT_OPEN | INSUFFICIENT_STOCK (details.productId, details.available)',
  })
  create(
    @CurrentTenant() tenantId: string,
    @CurrentOperator() operator: OperatorSession,
    @Body() body: CreateSaleDto,
  ): Promise<Sale> {
    return this.sales.create(tenantId, operator, body)
  }
}
