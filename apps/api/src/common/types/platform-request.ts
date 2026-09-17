import type { Request } from 'express'

// Sessão do superadmin — deliberadamente sem tenantId (ver PlatformAuthGuard
// e docs/specs/01-arquitetura.md § Autenticação de plataforma). Cookie e
// tipo separados de OperatorSession/RequestWithOperator (types/request.ts)
// para nunca colidir/confundir os dois tipos de sessão.
export interface PlatformSession {
  id: string
}

export interface RequestWithPlatformAdmin extends Request {
  platformAdmin?: PlatformSession
}

export const PLATFORM_SESSION_COOKIE = 'pdv_platform_session'
