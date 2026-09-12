import { createZodDto } from 'nestjs-zod'
import { updateProductSchema } from '@pdv/shared'

export class UpdateProductDto extends createZodDto(updateProductSchema) {}
