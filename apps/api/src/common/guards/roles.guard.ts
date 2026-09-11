import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { OperatorRole } from '@pdv/shared'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { ForbiddenError } from '../errors/domain.error'
import type { RequestWithOperator } from '../types/request'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<OperatorRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!roles || roles.length === 0) return true

    const { operator } = context.switchToHttp().getRequest<RequestWithOperator>()
    if (!operator || !roles.includes(operator.role)) {
      throw new ForbiddenError('ADMIN_ONLY', 'Apenas um Administrador pode fazer isso.')
    }
    return true
  }
}
