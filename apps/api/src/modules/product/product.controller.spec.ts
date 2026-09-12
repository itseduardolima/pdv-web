import { ArgumentMetadata } from '@nestjs/common'
import { ZodValidationException, ZodValidationPipe } from 'nestjs-zod'
import { CreateProductDto } from './dto/create-product.dto'

describe('ProductController DTO validation', () => {
  const pipe = new ZodValidationPipe()
  const metadata: ArgumentMetadata = { type: 'body', metatype: CreateProductDto }
  const valid = {
    name: 'Arroz',
    category: 'Estiva',
    unit: 'UN',
    salePriceCents: 100,
    costPriceCents: 50,
    stockQuantity: 1,
    minStock: 0,
  }

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

  it('accepts a valid product', () => {
    expect(pipe.transform(valid, metadata)).toMatchObject(valid)
  })

  it('answers in Portuguese for missing name and category', () => {
    const errors = fieldErrors({ ...valid, name: '', category: undefined })
    expect(errors.name).toEqual(['Informe o nome do produto'])
    expect(errors.category).toEqual(['Informe a categoria'])
  })

  it('rejects a non-numeric or negative price with a field message', () => {
    expect(fieldErrors({ ...valid, salePriceCents: null }).salePriceCents).toEqual(['Informe um valor válido'])
    expect(fieldErrors({ ...valid, costPriceCents: -1 }).costPriceCents).toEqual(['O valor não pode ser negativo'])
  })

  it('rejects a fractional stock quantity', () => {
    expect(fieldErrors({ ...valid, stockQuantity: 1.5 }).stockQuantity).toEqual(['Informe um número inteiro'])
  })
})
