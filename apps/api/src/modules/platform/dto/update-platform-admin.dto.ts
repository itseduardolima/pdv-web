import { createZodDto } from 'nestjs-zod'
import { updatePlatformAdminSchema } from '@pdv/shared'

export class UpdatePlatformAdminDto extends createZodDto(updatePlatformAdminSchema) {}
