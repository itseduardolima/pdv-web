import { addDaysToDayKey, dayKeyInTimeZone, isValidTimeZone, startOfDayInTimeZone } from './time-zone'

describe('time-zone utils', () => {
  it('reads the day of an instant in the store time zone, not in UTC', () => {
    // 01:30 UTC de 13/09 ainda é 12/09 às 22:30 em São Paulo (UTC-3)
    const instant = new Date('2026-09-13T01:30:00.000Z')
    expect(dayKeyInTimeZone(instant, 'America/Sao_Paulo')).toBe('2026-09-12')
    expect(dayKeyInTimeZone(instant, 'UTC')).toBe('2026-09-13')
  })

  it('finds the UTC instant where a store day starts', () => {
    expect(startOfDayInTimeZone('2026-09-12', 'America/Sao_Paulo').toISOString()).toBe('2026-09-12T03:00:00.000Z')
    expect(startOfDayInTimeZone('2026-09-12', 'UTC').toISOString()).toBe('2026-09-12T00:00:00.000Z')
    // fuso a leste de Greenwich: meia-noite local acontece "antes" em UTC
    expect(startOfDayInTimeZone('2026-09-12', 'Asia/Tokyo').toISOString()).toBe('2026-09-11T15:00:00.000Z')
  })

  it('handles a daylight-saving transition day', () => {
    // Nova York entra no horário de verão em 08/03/2026 (02:00 -> 03:00)
    expect(startOfDayInTimeZone('2026-03-08', 'America/New_York').toISOString()).toBe('2026-03-08T05:00:00.000Z')
    expect(startOfDayInTimeZone('2026-03-09', 'America/New_York').toISOString()).toBe('2026-03-09T04:00:00.000Z')
  })

  it('shifts day keys across month and year boundaries', () => {
    expect(addDaysToDayKey('2026-09-12', -6)).toBe('2026-09-06')
    expect(addDaysToDayKey('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDaysToDayKey('2025-12-31', 1)).toBe('2026-01-01')
  })

  it('validates IANA names', () => {
    expect(isValidTimeZone('America/Sao_Paulo')).toBe(true)
    expect(isValidTimeZone('Mars/Olympus')).toBe(false)
  })
})
