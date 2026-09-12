import { createZodDto } from 'nestjs-zod'
import { productListQuerySchema } from '@pdv/shared'

export class ProductListQueryDto extends createZodDto(productListQuerySchema) {}
