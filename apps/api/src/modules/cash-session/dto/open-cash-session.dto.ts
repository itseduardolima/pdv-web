import { createZodDto } from 'nestjs-zod'
import { openCashSessionSchema } from '@pdv/shared'

export class OpenCashSessionDto extends createZodDto(openCashSessionSchema) {}
