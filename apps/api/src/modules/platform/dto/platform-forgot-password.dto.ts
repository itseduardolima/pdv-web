import { createZodDto } from 'nestjs-zod'
import { platformForgotPasswordSchema } from '@pdv/shared'

export class PlatformForgotPasswordDto extends createZodDto(platformForgotPasswordSchema) {}
