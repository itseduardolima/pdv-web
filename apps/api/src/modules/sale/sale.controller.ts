import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common'
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
  createSaleSchema,
  saleSchema,
  syncSalesResultSchema,
  syncSalesSchema,
  voidSaleSchema,
  type Sale,
  type SyncSalesResult,
} from '@pdv/shared'
import { z } from 'zod'
import { CurrentOperator } from '../../common/decorators/current-operator.decorator'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { SESSION_COOKIE, type OperatorSession } from '../../common/types/request'
import { CreateSaleDto } from './dto/create-sale.dto'
import { SalesHistoryQueryDto } from './dto/sales-history-query.dto'
import { SyncSalesDto } from './dto/sync-sales.dto'
import { VoidSaleDto } from './dto/void-sale.dto'
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

  // Anula (nunca apaga) uma venda de caixa aberto e devolve o estoque.
  @Post(':id/void')
  @Roles('ADMIN')
  @HttpCode(200)
  @ApiBody({ schema: openApi(voidSaleSchema) })
  @ApiOkResponse({ schema: openApi(saleSchema), description: 'Venda anulada (marcada, não apagada)' })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION — motivo obrigatório' })
  @ApiForbiddenResponse({ schema: apiErrorOpenApi, description: 'ADMIN_ONLY' })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'SALE_NOT_FOUND' })
  @ApiConflictResponse({ schema: apiErrorOpenApi, description: 'ALREADY_VOIDED | CASH_SESSION_CLOSED' })
  void(
    @CurrentTenant() tenantId: string,
    @CurrentOperator() operator: OperatorSession,
    @Param('id') id: string,
    @Body() body: VoidSaleDto,
  ): Promise<Sale> {
    return this.sales.void(tenantId, id, operator, body)
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
