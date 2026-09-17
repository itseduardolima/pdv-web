import { createZodDto } from 'nestjs-zod'
import { platformTenantListQuerySchema } from '@pdv/shared'

export class ListPlatformTenantsDto extends createZodDto(platformTenantListQuerySchema) {}
