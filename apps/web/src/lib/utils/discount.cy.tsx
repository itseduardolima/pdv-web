import { buildDiscountInput, discountLabel, previewDiscountCents } from './discount'
import { maskPercentInput, parsePercentInput } from './money'

describe('previewDiscountCents', () => {
  it('uses the typed amount in cents', () => {
    expect(previewDiscountCents(1000, 'AMOUNT', '2,50')).to.eq(250)
  })

  it('computes a percentage rounded to whole cents', () => {
    expect(previewDiscountCents(1000, 'PERCENT', '10')).to.eq(100)
    expect(previewDiscountCents(999, 'PERCENT', '7,5')).to.eq(75)
  })

  it('shows no discount for empty or invalid text', () => {
    expect(previewDiscountCents(1000, 'AMOUNT', '')).to.eq(0)
    expect(previewDiscountCents(1000, 'PERCENT', 'abc')).to.eq(0)
  })

  it('shows no discount when it would cover the whole subtotal (the API refuses it)', () => {
    expect(previewDiscountCents(1000, 'AMOUNT', '10,00')).to.eq(0)
    expect(previewDiscountCents(1000, 'AMOUNT', '15,00')).to.eq(0)
  })
})

describe('buildDiscountInput', () => {
  it('sends nothing while the field is empty', () => {
    expect(buildDiscountInput('AMOUNT', '  ')).to.eq(undefined)
  })

  it('converts the text to the API unit (cents or basis points)', () => {
    expect(buildDiscountInput('AMOUNT', '2,50')).to.deep.equal({ type: 'AMOUNT', value: 250 })
    expect(buildDiscountInput('PERCENT', '7,5')).to.deep.equal({ type: 'PERCENT', value: 750 })
  })

  it('still sends an invalid value so the API answers with the field error', () => {
    expect(Number.isNaN(buildDiscountInput('PERCENT', 'x')?.value)).to.eq(true)
  })
})

describe('discountLabel', () => {
  it('names the percentage when the discount was in percent', () => {
    expect(discountLabel({ type: 'PERCENT', value: 1000 })).to.eq('Desconto (10%)')
    expect(discountLabel({ type: 'PERCENT', value: 750 })).to.eq('Desconto (7,5%)')
  })

  it('is plain for an amount or no input', () => {
    expect(discountLabel({ type: 'AMOUNT', value: 500 })).to.eq('Desconto')
    expect(discountLabel(null)).to.eq('Desconto')
  })
})

describe('percent input', () => {
  it('parses to basis points', () => {
    expect(parsePercentInput('10')).to.eq(1000)
    expect(parsePercentInput('12,25')).to.eq(1225)
    expect(Number.isNaN(parsePercentInput(''))).to.eq(true)
    expect(Number.isNaN(parsePercentInput('1,234'))).to.eq(true)
  })

  it('masks to at most 3 integer digits and 2 decimals', () => {
    expect(maskPercentInput('12a')).to.eq('12')
    expect(maskPercentInput('7.5')).to.eq('7,5')
    expect(maskPercentInput('1234')).to.eq('123')
    expect(maskPercentInput('10,999')).to.eq('10,99')
  })
})
