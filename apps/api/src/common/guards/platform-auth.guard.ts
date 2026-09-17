import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UnauthorizedError } from '../errors/domain.error'
import { PLATFORM_SESSION_COOKIE, type PlatformSession, type RequestWithPlatformAdmin } from '../types/platform-request'

interface PlatformSessionPayload {
  sub: string
}

// Paralelo ao AuthGuard (tenant), mas para a sessão de superadmin: lê o
// cookie próprio (pdv_platform_session), verifica com o JwtService do
// PlatformAuthModule (segredo separado, injetado por escopo de módulo —
// não é o JwtService global de operador). Nunca chama getTenantId(): não
// há tenant nenhum no contexto de uma rota de plataforma.
@Injectable()
export class PlatformAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithPlatformAdmin>()
    const token = (request.cookies as Record<string, string | undefined> | undefined)?.[PLATFORM_SESSION_COOKIE]
    if (!token) throw new UnauthorizedError()

    let session: PlatformSession
    try {
      const payload = await this.jwt.verifyAsync<PlatformSessionPayload>(token)
      session = { id: payload.sub }
    } catch {
      throw new UnauthorizedError('INVALID_SESSION', 'Sessão expirada. Faça login novamente.')
    }

    request.platformAdmin = session
    return true
  }
}
