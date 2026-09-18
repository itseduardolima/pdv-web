import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import {
  createSaleSchema,
  saleSchema,
  syncSalesResultSchema,
  syncSalesSchema,
  type Sale,
  type SyncSalesResult,
} from '@pdv/shared'
import { z } from 'zod'
import { CurrentOperator } from '../../common/decorators/current-operator.decorator'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { SESSION_COOKIE, type OperatorSession } from '../../common/types/request'
import { CreateSaleDto } from './dto/create-sale.dto'
import { SalesHistoryQueryDto } from './dto/sales-history-query.dto'
import { SyncSalesDto } from './dto/sync-sales.dto'
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

  // HU 8.2: a fila offline reenvia aqui quando volta a ter rede. Cada venda
  // do lote é idempotente por uuid (mesma regra do create); uma venda com
  // erro não derruba as outras — o resultado vem por item, sempre 200.
  @Post('sync')
  @HttpCode(200)
  @ApiBody({ schema: openApi(syncSalesSchema) })
  @ApiOkResponse({
    schema: openApi(syncSalesResultSchema),
    description: 'Um resultado por venda enviada (ok + venda, ou erro) — nunca falha o lote inteiro',
  })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION' })
  sync(
    @CurrentTenant() tenantId: string,
    @CurrentOperator() operator: OperatorSession,
    @Body() body: SyncSalesDto,
  ): Promise<SyncSalesResult> {
    return this.sales.syncBatch(tenantId, operator, body)
  }

  // Tela Histórico de Vendas: Admin e Operador (sem @Roles) — diferente de
  // Relatórios, que é agregado e só de Admin; aqui é "olhar venda por
  // venda" de um dia específico.
  @Get()
  @ApiOkResponse({
    schema: openApi(z.array(saleSchema)),
    description: 'Vendas de um dia (hoje/ontem/data), mais recente primeiro; filtro opcional por produto vendido',
  })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION (period=day exige date)' })
  history(@CurrentTenant() tenantId: string, @Query() query: SalesHistoryQueryDto): Promise<Sale[]> {
    return this.sales.history(tenantId, query)
  }
}
