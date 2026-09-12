import { createZodDto } from 'nestjs-zod'
import { setPinWithTokenInputSchema } from '@pdv/shared'

export class SetPinWithTokenDto extends createZodDto(setPinWithTokenInputSchema) {}
