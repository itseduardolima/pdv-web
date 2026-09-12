import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common'
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
  loginInputSchema,
  loginOperatorSchema,
  type CurrentSession,
  type LoginOperator,
} from '@pdv/shared'
import { z } from 'zod'
import { CurrentOperator } from '../../common/decorators/current-operator.decorator'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { apiErrorOpenApi, openApi } from '../../common/openapi'
import { SESSION_COOKIE, type OperatorSession } from '../../common/types/request'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookieOptions: CookieOptions

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    // Todos os flags de 08-seguranca § 4; Secure só cai em desenvolvimento
    // local (http://), nunca em staging/produção.
    this.cookieOptions = {
      httpOnly: true,
      secure: config.get<string>('NODE_ENV') !== 'development',
      sameSite: 'lax',
      path: '/',
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
