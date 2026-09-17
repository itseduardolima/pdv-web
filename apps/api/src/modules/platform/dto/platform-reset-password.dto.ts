import { createZodDto } from 'nestjs-zod'
import { platformResetPasswordSchema } from '@pdv/shared'

export class PlatformResetPasswordDto extends createZodDto(platformResetPasswordSchema) {}
