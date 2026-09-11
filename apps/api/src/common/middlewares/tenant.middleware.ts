import { Injectable, NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import { NotFoundError } from '../errors/domain.error'
import { TenantResolver, tenantStorage } from '../tenant-context'

// O apps/web repassa o host original em x-tenant-host; em acesso direto usa o Host.
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenants: TenantResolver) {}

  async use(request: Request, _response: Response, next: NextFunction) {
    const host = (request.header('x-tenant-host') ?? request.hostname).toLowerCase()
    const tenant = await this.tenants.resolveByHost(host)
    if (!tenant) {
      next(new NotFoundError('TENANT_NOT_FOUND', 'Loja não encontrada para este endereço.'))
      return
    }
    tenantStorage.run({ tenantId: tenant.id }, () => next())
  }
}
