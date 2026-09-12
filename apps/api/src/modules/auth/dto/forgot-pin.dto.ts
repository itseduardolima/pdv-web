import { createZodDto } from 'nestjs-zod'
import { forgotPinInputSchema } from '@pdv/shared'

export class ForgotPinDto extends createZodDto(forgotPinInputSchema) {}
