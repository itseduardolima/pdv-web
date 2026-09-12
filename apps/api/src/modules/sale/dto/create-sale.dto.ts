import { createZodDto } from 'nestjs-zod'
import { createSaleSchema } from '@pdv/shared'

export class CreateSaleDto extends createZodDto(createSaleSchema) {}
