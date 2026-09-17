import { createZodDto } from 'nestjs-zod'
import { platformLoginSchema } from '@pdv/shared'

export class PlatformLoginDto extends createZodDto(platformLoginSchema) {}
