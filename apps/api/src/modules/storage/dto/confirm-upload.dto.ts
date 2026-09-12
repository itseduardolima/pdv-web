import { createZodDto } from 'nestjs-zod'
import { confirmUploadSchema } from '@pdv/shared'

export class ConfirmUploadDto extends createZodDto(confirmUploadSchema) {}
