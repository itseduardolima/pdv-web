import { createZodDto } from 'nestjs-zod'
import { syncSalesSchema } from '@pdv/shared'

export class SyncSalesDto extends createZodDto(syncSalesSchema) {}
