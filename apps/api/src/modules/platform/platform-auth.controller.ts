import { Body, Controller, Get, HttpCode, Param, Patch, Post, Res, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { CookieOptions, Response } from 'express'
import {
  changePlatformAdminPasswordSchema,
  platformAdminSchema,
  platformForgotPasswordSchema,
  platformLoginSchema,
  platformResetPasswordSchema,
  platformResetTokenInfoSchema,
  updatePlatformAdminSchema,
  type PlatformAdmin,
  type PlatformResetTokenInfo,
} from '@pdv/shared'
import { CurrentPlatformAdmin } from '../../common/decorators/current-platform-admin.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { PlatformAuthGuard } from '../../common/guards/platform-auth.guard'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { PLATFORM_SESSION_COOKIE, type PlatformSession } from '../../common/types/platform-request'
import { ChangePlatformAdminPasswordDto } from './dto/change-platform-admin-password.dto'
import { PlatformForgotPasswordDto } from './dto/platform-forgot-password.dto'
import { PlatformLoginDto } from './dto/platform-login.dto'
import { PlatformResetPasswordDto } from './dto/platform-reset-password.dto'
import { UpdatePlatformAdminDto } from './dto/update-platform-admin.dto'
import { PlatformAuthService } from './platform-auth.service'
import { PlatformPasswordResetService } from './platform-password-reset.service'

// Toda rota é @Public() pra pular o AuthGuard de tenant (que exigiria o
// cookie pdv_session/tenantId — não fazem sentido aqui, essa sessão não
// pertence a loja nenhuma). A proteção de verdade é o PlatformAuthGuard,
// aplicado por rota.
@ApiTags('platform-auth')
@Controller('platform/auth')
export class PlatformAuthController {
  private readonly cookieOptions: CookieOptions

  constructor(
    private readonly auth: PlatformAuthService,
    private readonly passwordReset: PlatformPasswordResetService,
    config: ConfigService,
  ) {
    this.cookieOptions = {
      httpOnly: true,
      secure: config.get<string>('NODE_ENV') !== 'development',
      sameSite: 'lax',
      path: '/',
      // Ver auth.controller.ts — mesmo motivo: sem isso o Next.js nunca
      // recebe o cookie ao checar sessão no servidor pra admin.APP_DOMAIN.
      domain: config.get<string>('COOKIE_DOMAIN') || undefined,
      maxAge: config.get<number>('PLATFORM_SESSION_TTL_HOURS', 8) * 60 * 60 * 1000,
    }
  }

  @Public()
  // Login mais restrito que o de operador (5/60s): é a conta mais
  // privilegiada do sistema (08-seguranca § 5).
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiBody({ schema: openApi(platformLoginSchema) })
  @ApiOkResponse({
    schema: openApi(platformAdminSchema),
    description: 'Sessão criada; cookie pdv_platform_session setado',
  })
  @ApiUnauthorizedResponse({
    schema: apiErrorOpenApi,
    description: 'INVALID_CREDENTIALS — mesma resposta para qualquer causa',
  })
  @ApiTooManyRequestsResponse({ schema: apiErrorOpenApi })
  async login(@Body() body: PlatformLoginDto, @Res({ passthrough: true }) response: Response): Promise<PlatformAdmin> {
    const { token, admin } = await this.auth.login(body)
    response.cookie(PLATFORM_SESSION_COOKIE, token, this.cookieOptions)
    return admin
  }

  @Public()
  @UseGuards(PlatformAuthGuard)
  @Post('logout')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Cookie de sessão removido' })
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(PLATFORM_SESSION_COOKIE, { ...this.cookieOptions, maxAge: undefined })
  }

  @Public()
  @UseGuards(PlatformAuthGuard)
  @Get('me')
  @ApiOkResponse({ schema: openApi(platformAdminSchema) })
  @ApiUnauthorizedResponse({ schema: apiErrorOpenApi })
  me(@CurrentPlatformAdmin() session: PlatformSession): Promise<PlatformAdmin> {
    return this.auth.me(session)
  }

  @Public()
  @UseGuards(PlatformAuthGuard)
  @Patch('me')
  @ApiBody({ schema: openApi(updatePlatformAdminSchema) })
  @ApiOkResponse({ schema: openApi(platformAdminSchema) })
  @ApiConflictResponse({ schema: apiErrorOpenApi, description: 'EMAIL_IN_USE' })
  updateProfile(
    @CurrentPlatformAdmin() session: PlatformSession,
    @Body() body: UpdatePlatformAdminDto,
  ): Promise<PlatformAdmin> {
    return this.auth.updateProfile(session, body)
  }

  @Public()
  @UseGuards(PlatformAuthGuard)
  // Mesmo throttle do login: a sessão já está autenticada, mas ainda assim
  // limita quantas vezes alguém pode tentar adivinhar a senha atual.
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @Patch('password')
  @HttpCode(204)
  @ApiBody({ schema: openApi(changePlatformAdminPasswordSchema) })
  @ApiNoContentResponse({ description: 'Senha alterada' })
  @ApiUnauthorizedResponse({ schema: apiErrorOpenApi, description: 'INVALID_CURRENT_PASSWORD' })
  @ApiTooManyRequestsResponse({ schema: apiErrorOpenApi })
  async changePassword(
    @CurrentPlatformAdmin() session: PlatformSession,
    @Body() body: ChangePlatformAdminPasswordDto,
  ): Promise<void> {
    await this.auth.changePassword(session, body)
  }

  // As 3 rotas abaixo são anônimas por definição (token na URL é a
  // autorização) — sem PlatformAuthGuard, só @Public() pra pular o
  // AuthGuard de tenant.
  @Public()
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @Post('forgot-password')
  @HttpCode(204)
  @ApiBody({ schema: openApi(platformForgotPasswordSchema) })
  @ApiNoContentResponse({ description: 'Sempre 204: se houver conta com esse e-mail, recebe o link' })
  @ApiTooManyRequestsResponse({ schema: apiErrorOpenApi })
  forgotPassword(@Body() body: PlatformForgotPasswordDto): Promise<void> {
    return this.auth.forgotPassword(body)
  }

  @Public()
  @Get('reset-token/:token')
  @ApiOkResponse({ schema: openApi(platformResetTokenInfoSchema), description: 'Nome do admin dono do link' })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'INVALID_TOKEN — inexistente, usado ou expirado' })
  inspectResetToken(@Param('token') token: string): Promise<PlatformResetTokenInfo> {
    return this.passwordReset.inspect(token)
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @Post('reset-password')
  @HttpCode(204)
  @ApiBody({ schema: openApi(platformResetPasswordSchema) })
  @ApiNoContentResponse({ description: 'Senha redefinida; o link deixa de valer' })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION ou INVALID_TOKEN' })
  async resetPassword(@Body() body: PlatformResetPasswordDto): Promise<void> {
    await this.passwordReset.resetPassword(body.token, body.newPassword)
  }
}
