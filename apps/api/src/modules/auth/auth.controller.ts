import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Throttle } from '@nestjs/throttler'
import type { CookieOptions, Response } from 'express'
import type { CurrentSession, LoginOperator } from '@pdv/shared'
import { CurrentOperator } from '../../common/decorators/current-operator.decorator'
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { SESSION_COOKIE, type OperatorSession } from '../../common/types/request'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

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
  listOperators(@CurrentTenant() tenantId: string): Promise<LoginOperator[]> {
    return this.auth.listOperators(tenantId)
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
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
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(SESSION_COOKIE, { ...this.cookieOptions, maxAge: undefined })
  }

  @Get('me')
  me(@CurrentOperator() session: OperatorSession): Promise<CurrentSession> {
    return this.auth.me(session)
  }
}
