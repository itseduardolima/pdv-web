import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common'
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
import {
  createOperatorSchema,
  operatorSchema,
  setActiveSchema,
  setPinSchema,
  updateOperatorSchema,
  type Operator,
} from '@pdv/shared'
import { z } from 'zod'
import { CurrentOperator } from '../../common/decorators/current-operator.decorator'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { SESSION_COOKIE, type OperatorSession } from '../../common/types/request'
import { CreateOperatorDto } from './dto/create-operator.dto'
import { SetActiveDto } from './dto/set-active.dto'
import { SetPinDto } from './dto/set-pin.dto'
import { UpdateOperatorDto } from './dto/update-operator.dto'
import { OperatorService } from './operator.service'

// Tudo aqui é só Administrador (03-regras-negocio § Papéis).
@ApiTags('operators')
@ApiCookieAuth(SESSION_COOKIE)
@ApiForbiddenResponse({ schema: apiErrorOpenApi, description: 'ADMIN_ONLY' })
@Roles('ADMIN')
@Controller('operators')
export class OperatorController {
  constructor(private readonly operators: OperatorService) {}

  @Get()
  @ApiOkResponse({ schema: openApi(z.array(operatorSchema)), description: 'Operadores da loja, inativos inclusos' })
  list(@CurrentTenant() tenantId: string): Promise<Operator[]> {
    return this.operators.list(tenantId)
  }

  @Get(':id')
  @ApiOkResponse({ schema: openApi(operatorSchema) })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'OPERATOR_NOT_FOUND' })
  get(@CurrentTenant() tenantId: string, @Param('id') id: string): Promise<Operator> {
    return this.operators.get(tenantId, id)
  }

  @Post()
  @ApiBody({ schema: openApi(createOperatorSchema) })
  @ApiCreatedResponse({ schema: openApi(operatorSchema) })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION — details.fieldErrors por campo' })
  @ApiConflictResponse({ schema: apiErrorOpenApi, description: 'EMAIL_IN_USE' })
  create(@CurrentTenant() tenantId: string, @Body() body: CreateOperatorDto): Promise<Operator> {
    return this.operators.create(tenantId, body)
  }

  @Patch(':id')
  @ApiBody({ schema: openApi(updateOperatorSchema) })
  @ApiOkResponse({ schema: openApi(operatorSchema) })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'OPERATOR_NOT_FOUND' })
  @ApiConflictResponse({
    schema: apiErrorOpenApi,
    description: 'LAST_ADMIN / SELF_CHANGE (ao rebaixar) / EMAIL_IN_USE',
  })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateOperatorDto,
    @CurrentOperator() actor: OperatorSession,
  ): Promise<Operator> {
    return this.operators.update(tenantId, id, body, actor)
  }

  @Post(':id/send-pin-link')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'E-mail com link de primeiro acesso (sem PIN) ou de redefinição (com PIN)' })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'OPERATOR_NOT_FOUND' })
  @ApiConflictResponse({ schema: apiErrorOpenApi, description: 'NO_EMAIL / OPERATOR_INACTIVE' })
  sendPinLink(@CurrentTenant() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.operators.sendPinLink(tenantId, id)
  }

  @Patch(':id/pin')
  @ApiBody({ schema: openApi(setPinSchema) })
  @ApiOkResponse({ schema: openApi(operatorSchema) })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'OPERATOR_NOT_FOUND' })
  setPin(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: SetPinDto): Promise<Operator> {
    return this.operators.setPin(tenantId, id, body.pin)
  }

  @Patch(':id/active')
  @ApiBody({ schema: openApi(setActiveSchema) })
  @ApiOkResponse({ schema: openApi(operatorSchema) })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'OPERATOR_NOT_FOUND' })
  @ApiConflictResponse({ schema: apiErrorOpenApi, description: 'LAST_ADMIN / SELF_CHANGE (ao inativar)' })
  setActive(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: SetActiveDto,
    @CurrentOperator() actor: OperatorSession,
  ): Promise<Operator> {
    return this.operators.setActive(tenantId, id, body.active, actor)
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Soft-delete: some da lista e do Login; vendas antigas mantêm o operador' })
  @ApiNotFoundResponse({ schema: apiErrorOpenApi, description: 'OPERATOR_NOT_FOUND' })
  @ApiConflictResponse({ schema: apiErrorOpenApi, description: 'LAST_ADMIN / SELF_CHANGE' })
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentOperator() actor: OperatorSession,
  ): Promise<void> {
    return this.operators.remove(tenantId, id, actor)
  }
}
