import { Body, Controller, Get, HttpCode, Param, Post, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { CookieOptions, Response } from 'express'
import {
  currentSessionSchema,
  forgotPinInputSchema,
  loginInputSchema,
  loginOperatorSchema,
  pinTokenInfoSchema,
  setPinWithTokenInputSchema,
  type CurrentSession,
  type LoginOperator,
  type PinTokenInfo,
} from '@pdv/shared'
import { z } from 'zod'
import { CurrentOperator } from '../../common/decorators/current-operator.decorator'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { SESSION_COOKIE, type OperatorSession } from '../../common/types/request'
import { AuthService } from './auth.service'
import { ForgotPinDto } from './dto/forgot-pin.dto'
import { LoginDto } from './dto/login.dto'
import { SetPinWithTokenDto } from './dto/set-pin-with-token.dto'
import { PinTokenService } from './pin-token.service'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookieOptions: CookieOptions

  constructor(
    private readonly auth: AuthService,
    private readonly pinTokens: PinTokenService,
    config: ConfigService,
  ) {
    // Todos os flags de 08-seguranca § 4; Secure só cai em desenvolvimento
    // local (http://), nunca em staging/produção.
    // COOKIE_DOMAIN é obrigatório sempre que APP_DOMAIN e API_DOMAIN forem
    // hosts diferentes (caso normal em produção): sem isso, o cookie fica
    // restrito ao host da própria API e o Next.js nunca o recebe ao checar
    // sessão no servidor pra renderizar uma página em app.<domínio>.
    this.cookieOptions = {
      httpOnly: true,
      secure: config.get<string>('NODE_ENV') !== 'development',
      sameSite: 'lax',
      path: '/',
      domain: config.get<string>('COOKIE_DOMAIN') || undefined,
      maxAge: config.get<number>('SESSION_TTL_HOURS', 12) * 60 * 60 * 1000,
    }
  }

  @Public()
  @Get('operators')
  @ApiOkResponse({
    schema: openApi(z.array(loginOperatorSchema)),
    description: 'Operadores ativos da loja, para a tela de Login',
  })
  listOperators(@CurrentTenant() tenantId: string): Promise<LoginOperator[]> {
    return this.auth.listOperators(tenantId)
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiBody({ schema: openApi(loginInputSchema) })
  @ApiOkResponse({ schema: openApi(currentSessionSchema), description: 'Sessão criada; cookie pdv_session setado' })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION — details.fieldErrors por campo' })
  @ApiUnauthorizedResponse({
    schema: apiErrorOpenApi,
    description: 'INVALID_CREDENTIALS — mesma resposta para qualquer causa',
  })
  @ApiTooManyRequestsResponse({ schema: apiErrorOpenApi, description: 'TOO_MANY_ATTEMPTS — 5 falhas em 60s' })
  async login(
    @CurrentTenant() tenantId: string,
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CurrentSession> {
    const { token, session } = await this.auth.login(tenantId, body)
    response.cookie(SESSION_COOKIE, token, this.cookieOptions)
    return session
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-pin')
  @HttpCode(204)
  @ApiBody({ schema: openApi(forgotPinInputSchema) })
  @ApiNoContentResponse({ description: 'Sempre 204: se houver operador ativo com esse e-mail, recebe o link' })
  @ApiTooManyRequestsResponse({ schema: apiErrorOpenApi })
  forgotPin(@CurrentTenant() tenantId: string, @Body() body: ForgotPinDto): Promise<void> {
    return this.auth.forgotPin(tenantId, body)
  }

  @Public()
  @Get('pin-token/:token')
  @ApiOkResponse({ schema: openApi(pinTokenInfoSchema), description: 'Nome do operador e finalidade do link' })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'INVALID_TOKEN — inexistente, usado ou expirado' })
  inspectPinToken(@CurrentTenant() tenantId: string, @Param('token') token: string): Promise<PinTokenInfo> {
    return this.pinTokens.inspect(tenantId, token)
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('set-pin')
  @HttpCode(204)
  @ApiBody({ schema: openApi(setPinWithTokenInputSchema) })
  @ApiNoContentResponse({ description: 'PIN definido; o link deixa de valer' })
  @ApiBadRequestResponse({ schema: apiErrorOpenApi, description: 'VALIDATION ou INVALID_TOKEN' })
  setPin(@CurrentTenant() tenantId: string, @Body() body: SetPinWithTokenDto): Promise<void> {
    return this.pinTokens.setPin(tenantId, body.token, body.pin)
  }

  @Post('logout')
  @HttpCode(204)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiNoContentResponse({ description: 'Cookie de sessão removido' })
  @ApiUnauthorizedResponse({ schema: apiErrorOpenApi })
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(SESSION_COOKIE, { ...this.cookieOptions, maxAge: undefined })
  }

  @Get('me')
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOkResponse({ schema: openApi(currentSessionSchema) })
  @ApiUnauthorizedResponse({ schema: apiErrorOpenApi, description: 'UNAUTHENTICATED ou INVALID_SESSION' })
  me(@CurrentOperator() session: OperatorSession): Promise<CurrentSession> {
    return this.auth.me(session)
  }
}
