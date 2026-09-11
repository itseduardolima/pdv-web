import { createParamDecorator } from '@nestjs/common'
import { getTenantId } from '../tenant-context'

export const CurrentTenant = createParamDecorator((): string => getTenantId())
