import { Injectable, NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import { ForbiddenError, NotFoundError } from '../errors/domain.error'
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
    // 403 (não 404): precisa diferenciar "loja suspensa" de "loja não existe"
    // (HU 13.7) — quem vê essa tela é o próprio dono/operador da loja
    // suspensa, não um estranho testando slugs.
    if (!tenant.active) {
      next(new ForbiddenError('TENANT_SUSPENDED', 'Esta loja foi suspensa. Fale com o suporte.'))
      return
    }
    tenantStorage.run({ tenantId: tenant.id }, () => next())
  }
}
