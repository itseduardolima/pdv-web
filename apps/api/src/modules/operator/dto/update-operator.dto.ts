import { createZodDto } from 'nestjs-zod'
import { updateOperatorSchema } from '@pdv/shared'

export class UpdateOperatorDto extends createZodDto(updateOperatorSchema) {}
