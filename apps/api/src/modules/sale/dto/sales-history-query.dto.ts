import { createZodDto } from 'nestjs-zod'
import { salesHistoryQuerySchema } from '@pdv/shared'

export class SalesHistoryQueryDto extends createZodDto(salesHistoryQuerySchema) {}
