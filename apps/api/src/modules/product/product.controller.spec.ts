import { ArgumentMetadata } from '@nestjs/common'
import { ZodValidationException, ZodValidationPipe } from 'nestjs-zod'
import { CreateProductDto } from './dto/create-product.dto'

describe('ProductController DTO validation', () => {
  const pipe = new ZodValidationPipe()
  const metadata: ArgumentMetadata = { type: 'body', metatype: CreateProductDto }
  const valid = { name: 'Arroz', category: 'Estiva', unit: 'UN', salePriceCents: 100, stockQuantity: 1 }

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

  it('accepts a valid product and fills cost 0 and minimum stock 5 when omitted', () => {
    expect(pipe.transform(valid, metadata)).toMatchObject({ ...valid, costPriceCents: 0, minStock: 5 })
  })

  it('answers in Portuguese for missing name and category', () => {
    const errors = fieldErrors({ ...valid, name: '', category: undefined })
    expect(errors.name).toEqual(['O nome precisa ter pelo menos 2 caracteres'])
    expect(errors.category).toEqual(['Informe a categoria'])
  })

  it('rejects a non-numeric or negative price with a field message', () => {
    expect(fieldErrors({ ...valid, salePriceCents: null }).salePriceCents).toEqual(['Informe um valor válido'])
    expect(fieldErrors({ ...valid, salePriceCents: -1 }).salePriceCents).toEqual(['O valor não pode ser negativo'])
  })

  it('rejects a fractional stock quantity', () => {
    expect(fieldErrors({ ...valid, stockQuantity: 1.5 }).stockQuantity).toEqual(['Informe um número inteiro'])
  })
})
