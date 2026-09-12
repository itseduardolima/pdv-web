import { createZodDto } from 'nestjs-zod'
import { createOperatorSchema } from '@pdv/shared'

export class CreateOperatorDto extends createZodDto(createOperatorSchema) {}
