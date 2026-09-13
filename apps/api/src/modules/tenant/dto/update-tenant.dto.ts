import { createZodDto } from 'nestjs-zod'
import { updateTenantSchema } from '@pdv/shared'

export class UpdateTenantDto extends createZodDto(updateTenantSchema) {}
