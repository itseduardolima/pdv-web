import { ArgumentMetadata } from '@nestjs/common'
import { ZodValidationException, ZodValidationPipe } from 'nestjs-zod'
import { LoginDto } from './dto/login.dto'

// O DTO é validado pelo ZodValidationPipe global: aqui garantimos que o
// contrato rejeita o que a API nunca deve aceitar.
describe('AuthController DTO validation', () => {
  const pipe = new ZodValidationPipe()
  const metadata: ArgumentMetadata = { type: 'body', metatype: LoginDto }

  function fieldErrors(payload: unknown): Record<string, string[] | undefined> {
    try {
      pipe.transform(payload, metadata)
    } catch (error) {
      if (error instanceof ZodValidationException) {
        return error.getZodError().flatten().fieldErrors as Record<string, string[] | undefined>
      }
      throw error
    }
    throw new Error('expected validation to fail')
  }

  it('accepts a valid login payload', () => {
    expect(pipe.transform({ operatorId: 'op1', pin: '1234' }, metadata)).toEqual({ operatorId: 'op1', pin: '1234' })
  })

  it('rejects a PIN that is not exactly 4 digits, with a field error message', () => {
    expect(fieldErrors({ operatorId: 'op1', pin: '123' }).pin).toEqual(['O PIN deve ter exatamente 4 dígitos'])
    expect(fieldErrors({ operatorId: 'op1', pin: '12a4' }).pin).toBeDefined()
  })

  it('rejects a missing operatorId', () => {
    expect(fieldErrors({ pin: '1234' }).operatorId).toBeDefined()
  })

  it('strips unknown fields (no mass assignment through the login body)', () => {
    expect(pipe.transform({ operatorId: 'op1', pin: '1234', role: 'ADMIN' }, metadata)).toEqual({
      operatorId: 'op1',
      pin: '1234',
    })
  })
})
