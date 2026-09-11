import { SetMetadata } from '@nestjs/common'
import type { OperatorRole } from '@pdv/shared'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: OperatorRole[]) => SetMetadata(ROLES_KEY, roles)
