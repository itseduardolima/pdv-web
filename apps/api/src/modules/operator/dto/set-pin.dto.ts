import { createZodDto } from 'nestjs-zod'
import { setPinSchema } from '@pdv/shared'

export class SetPinDto extends createZodDto(setPinSchema) {}
