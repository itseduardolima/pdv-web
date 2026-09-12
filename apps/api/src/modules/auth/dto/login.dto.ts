import { createZodDto } from 'nestjs-zod'
import { loginInputSchema } from '@pdv/shared'

export class LoginDto extends createZodDto(loginInputSchema) {}
