import { createZodDto } from 'nestjs-zod'
import { changePlatformAdminPasswordSchema } from '@pdv/shared'

export class ChangePlatformAdminPasswordDto extends createZodDto(changePlatformAdminPasswordSchema) {}
