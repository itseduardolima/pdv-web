import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { UnauthorizedError } from '../errors/domain.error'
import type { PlatformSession, RequestWithPlatformAdmin } from '../types/platform-request'

export const CurrentPlatformAdmin = createParamDecorator((_: unknown, context: ExecutionContext): PlatformSession => {
  const request = context.switchToHttp().getRequest<RequestWithPlatformAdmin>()
  if (!request.platformAdmin) throw new UnauthorizedError()
  return request.platformAdmin
})
