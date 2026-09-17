import { createZodDto } from 'nestjs-zod'
import { createPlatformTenantSchema } from '@pdv/shared'

export class CreatePlatformTenantDto extends createZodDto(createPlatformTenantSchema) {}
