import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import {
  confirmUploadSchema,
  confirmedUploadSchema,
  createUploadSchema,
  uploadTicketSchema,
  type ConfirmedUpload,
  type UploadTicket,
} from '@pdv/shared'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { SESSION_COOKIE } from '../../common/types/request'
import { ConfirmUploadDto } from './dto/confirm-upload.dto'
import { CreateUploadDto } from './dto/create-upload.dto'
import { StorageService } from './storage.service'

@ApiTags('uploads')
@ApiCookieAuth(SESSION_COOKIE)
@Roles('ADMIN')
@Controller('uploads')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  @ApiBody({ schema: openApi(createUploadSchema) })
  @ApiCreatedResponse({
    schema: openApi(uploadTicketSchema),
    description: 'Presigned POST: enviar `fields` + `file` como multipart para `uploadUrl`',
  })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION (tipo/tamanho)' })
  @ApiForbiddenResponse({ schema: apiErrorOpenApi, description: 'ADMIN_ONLY' })
  create(@CurrentTenant() tenantId: string, @Body() body: CreateUploadDto): Promise<UploadTicket> {
    return this.storage.createUpload(tenantId, body)
  }

  @Post('confirm')
  @HttpCode(200)
  @ApiBody({ schema: openApi(confirmUploadSchema) })
  @ApiOkResponse({ schema: openApi(confirmedUploadSchema), description: 'URL pública para gravar em photoUrl/logoUrl' })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'INVALID_UPLOAD' })
  confirm(@CurrentTenant() tenantId: string, @Body() body: ConfirmUploadDto): Promise<ConfirmedUpload> {
    return this.storage.confirmUpload(tenantId, body.key)
  }
}
