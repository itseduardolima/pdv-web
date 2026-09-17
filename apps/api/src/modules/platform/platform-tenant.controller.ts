import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import {
  createPlatformTenantSchema,
  platformTenantPageSchema,
  platformTenantSchema,
  setPlatformTenantActiveSchema,
  type PlatformTenant,
  type PlatformTenantPage,
} from '@pdv/shared'
import { Public } from '../../common/decorators/public.decorator'
import { PlatformAuthGuard } from '../../common/guards/platform-auth.guard'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { CreatePlatformTenantDto } from './dto/create-platform-tenant.dto'
import { ListPlatformTenantsDto } from './dto/list-platform-tenants.dto'
import { SetTenantActiveDto } from './dto/set-tenant-active.dto'
import { PlatformTenantService } from './platform-tenant.service'

// @Public() pra pular o AuthGuard de tenant (não faz sentido numa rota que
// não pertence a loja nenhuma) — a proteção real é o PlatformAuthGuard.
@ApiTags('platform-tenants')
@Controller('platform/tenants')
@Public()
@UseGuards(PlatformAuthGuard)
export class PlatformTenantController {
  constructor(private readonly tenants: PlatformTenantService) {}

  @Post()
  @ApiBody({ schema: openApi(createPlatformTenantSchema) })
  @ApiCreatedResponse({ schema: openApi(platformTenantSchema) })
  @ApiConflictResponse({ schema: apiErrorOpenApi, description: 'SLUG_IN_USE' })
  create(@Body() body: CreatePlatformTenantDto): Promise<PlatformTenant> {
    return this.tenants.create(body)
  }

  @Get()
  @ApiOkResponse({ schema: openApi(platformTenantPageSchema) })
  list(@Query() query: ListPlatformTenantsDto): Promise<PlatformTenantPage> {
    return this.tenants.list(query)
  }

  @Patch(':id/active')
  @ApiBody({ schema: openApi(setPlatformTenantActiveSchema) })
  @ApiOkResponse({ schema: openApi(platformTenantSchema) })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'TENANT_NOT_FOUND' })
  setActive(@Param('id') id: string, @Body() body: SetTenantActiveDto): Promise<PlatformTenant> {
    return this.tenants.setActive(id, body.active)
  }
}
