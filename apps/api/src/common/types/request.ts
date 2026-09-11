import type { Request } from 'express'
import type { OperatorRole } from '@pdv/shared'

export interface OperatorSession {
  id: string
  tenantId: string
  role: OperatorRole
}

export interface RequestWithOperator extends Request {
  operator?: OperatorSession
}

export const SESSION_COOKIE = 'pdv_session'
