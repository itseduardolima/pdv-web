import { randomUUID } from 'node:crypto'
import { Injectable, NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import { requestStorage } from '../request-context'

export const REQUEST_ID_HEADER = 'x-request-id'

// Registrado ANTES do TenantMiddleware em app.module.ts, sem exclude: todo
// log de uma mesma request precisa ser correlacionável, mesmo em rotas fora
// de tenant (health, platform/*, docs) — 09-operacao § 3.
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(_request: Request, response: Response, next: NextFunction) {
    const requestId = randomUUID()
    response.setHeader(REQUEST_ID_HEADER, requestId)
    requestStorage.run({ requestId }, () => next())
  }
}
