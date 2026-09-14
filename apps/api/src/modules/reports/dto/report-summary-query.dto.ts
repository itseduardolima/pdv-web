import { createZodDto } from 'nestjs-zod'
import { reportSummaryQuerySchema } from '@pdv/shared'

export class ReportSummaryQueryDto extends createZodDto(reportSummaryQuerySchema) {}
