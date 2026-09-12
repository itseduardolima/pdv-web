import { createZodDto } from 'nestjs-zod'
import { createProductSchema } from '@pdv/shared'

export class CreateProductDto extends createZodDto(createProductSchema) {}
