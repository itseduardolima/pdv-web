import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { createProductSchema, productSchema, updateProductSchema, type Product } from '@pdv/shared'
import { z } from 'zod'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { SESSION_COOKIE } from '../../common/types/request'
import { CreateProductDto } from './dto/create-product.dto'
import { ProductListQueryDto } from './dto/product-list-query.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { ProductService } from './product.service'

@ApiTags('products')
@ApiCookieAuth(SESSION_COOKIE)
@Controller('products')
export class ProductController {
  constructor(private readonly products: ProductService) {}

  @Get()
  @ApiOkResponse({
    schema: openApi(z.array(productSchema)),
    description: 'Produtos ativos da loja (query: search, category)',
  })
  list(@CurrentTenant() tenantId: string, @Query() query: ProductListQueryDto): Promise<Product[]> {
    return this.products.list(tenantId, query)
  }

  @Get('categories')
  @ApiOkResponse({ schema: openApi(z.array(z.string())), description: 'Categorias em uso na loja' })
  listCategories(@CurrentTenant() tenantId: string): Promise<string[]> {
    return this.products.listCategories(tenantId)
  }

  @Get(':id')
  @ApiOkResponse({ schema: openApi(productSchema) })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'PRODUCT_NOT_FOUND' })
  get(@CurrentTenant() tenantId: string, @Param('id') id: string): Promise<Product> {
    return this.products.get(tenantId, id)
  }

  @Post()
  @Roles('ADMIN')
  @ApiBody({ schema: openApi(createProductSchema) })
  @ApiCreatedResponse({ schema: openApi(productSchema) })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION — details.fieldErrors por campo' })
  @ApiConflictResponse({ schema: apiErrorOpenApi, description: 'BARCODE_IN_USE' })
  @ApiForbiddenResponse({ schema: apiErrorOpenApi, description: 'ADMIN_ONLY' })
  create(@CurrentTenant() tenantId: string, @Body() body: CreateProductDto): Promise<Product> {
    return this.products.create(tenantId, body)
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiBody({ schema: openApi(updateProductSchema) })
  @ApiOkResponse({ schema: openApi(productSchema) })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION' })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'PRODUCT_NOT_FOUND' })
  @ApiConflictResponse({ schema: apiErrorOpenApi, description: 'BARCODE_IN_USE' })
  @ApiForbiddenResponse({ schema: apiErrorOpenApi, description: 'ADMIN_ONLY' })
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: UpdateProductDto): Promise<Product> {
    return this.products.update(tenantId, id, body)
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Soft-delete: produto some da lista e da venda; histórico preservado' })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'PRODUCT_NOT_FOUND' })
  @ApiForbiddenResponse({ schema: apiErrorOpenApi, description: 'ADMIN_ONLY' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.products.remove(tenantId, id)
  }
}
