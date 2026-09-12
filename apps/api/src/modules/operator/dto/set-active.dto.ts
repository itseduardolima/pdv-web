import { createZodDto } from 'nestjs-zod'
import { setActiveSchema } from '@pdv/shared'

export class SetActiveDto extends createZodDto(setActiveSchema) {}
