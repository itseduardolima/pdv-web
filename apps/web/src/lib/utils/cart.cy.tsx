import { splitEvenly } from './cart'

// Função pura: sem componente para montar, só a conta.
describe('splitEvenly', () => {
  it('gives each person the floor and the last one absorbs the leftover cents', () => {
    expect(splitEvenly(29194, 3)).to.deep.equal([9731, 9731, 9732])
  })

  it('splits evenly when the total divides exactly', () => {
    expect(splitEvenly(10000, 4)).to.deep.equal([2500, 2500, 2500, 2500])
  })

  it('always sums back to the total', () => {
    for (const total of [1, 99, 101, 29194, 123457]) {
      for (const parts of [2, 3, 4, 5]) {
        expect(splitEvenly(total, parts).reduce((sum, cents) => sum + cents, 0)).to.eq(total)
      }
    }
  })
})
