import { createZodDto } from 'nestjs-zod'
import { setPlatformTenantActiveSchema } from '@pdv/shared'

export class SetTenantActiveDto extends createZodDto(setPlatformTenantActiveSchema) {}
