import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { UnauthorizedError } from '../errors/domain.error'
import type { OperatorSession, RequestWithOperator } from '../types/request'

export const CurrentOperator = createParamDecorator((_: unknown, context: ExecutionContext): OperatorSession => {
  const request = context.switchToHttp().getRequest<RequestWithOperator>()
  if (!request.operator) throw new UnauthorizedError()
  return request.operator
})
