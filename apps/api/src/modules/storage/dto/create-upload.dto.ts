import { createZodDto } from 'nestjs-zod'
import { createUploadSchema } from '@pdv/shared'

export class CreateUploadDto extends createZodDto(createUploadSchema) {}
