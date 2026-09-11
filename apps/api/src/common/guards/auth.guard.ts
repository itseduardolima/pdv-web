import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { PUBLIC_KEY } from '../decorators/public.decorator'
import { UnauthorizedError } from '../errors/domain.error'
import { getTenantId } from '../tenant-context'
import { SESSION_COOKIE, type OperatorSession, type RequestWithOperator } from '../types/request'

interface SessionPayload {
  sub: string
  tenantId: string
  role: OperatorSession['role']
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [context.getHandler(), context.getClass()])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<RequestWithOperator>()
    const token = (request.cookies as Record<string, string | undefined> | undefined)?.[SESSION_COOKIE]
    if (!token) throw new UnauthorizedError()

    let session: OperatorSession
    try {
      const payload = await this.jwt.verifyAsync<SessionPayload>(token)
      session = { id: payload.sub, tenantId: payload.tenantId, role: payload.role }
    } catch {
      throw new UnauthorizedError('INVALID_SESSION', 'Sessão expirada. Faça login novamente.')
    }

    // Sessão de um tenant nunca vale em outro, mesmo com token válido.
    if (session.tenantId !== getTenantId()) {
      throw new UnauthorizedError('INVALID_SESSION', 'Sessão inválida para esta loja.')
    }

    request.operator = session
    return true
  }
}
