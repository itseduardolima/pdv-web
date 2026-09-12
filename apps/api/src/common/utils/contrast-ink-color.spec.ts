import { contrastInkColor } from './contrast-ink-color'

describe('contrastInkColor', () => {
  it('returns black over a light primary (default yellow)', () => {
    expect(contrastInkColor('#e6e51e')).toBe('#000000')
  })

  it('returns white over a dark primary', () => {
    expect(contrastInkColor('#1a237e')).toBe('#ffffff')
  })

  it('returns white over pure black and black over pure white', () => {
    expect(contrastInkColor('#000000')).toBe('#ffffff')
    expect(contrastInkColor('#ffffff')).toBe('#000000')
  })

  it('is case-insensitive', () => {
    expect(contrastInkColor('#E6E51E')).toBe('#000000')
  })
})
