import { createZodDto } from 'nestjs-zod'
import { voidSaleSchema } from '@pdv/shared'

export class VoidSaleDto extends createZodDto(voidSaleSchema) {}
