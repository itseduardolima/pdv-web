import { requestStorage } from '../request-context'
import { tenantStorage } from '../tenant-context'
import { StructuredLogger } from './structured-logger'

function captureWrites(fn: () => void): Record<string, unknown>[] {
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
  try {
    fn()
    return spy.mock.calls.map((call) => JSON.parse(String(call[0])) as Record<string, unknown>)
  } finally {
    spy.mockRestore()
  }
}

describe('StructuredLogger', () => {
  it('writes a JSON line with timestamp, level and message', () => {
    const logger = new StructuredLogger(false)
    const [entry] = captureWrites(() => logger.log('hello', 'SomeContext'))
    expect(entry).toMatchObject({ level: 'log', message: 'hello', context: 'SomeContext' })
    expect(typeof entry?.timestamp).toBe('string')
  })

  it('includes requestId and tenantId when inside their AsyncLocalStorage context', () => {
    const logger = new StructuredLogger(false)
    const [entry] = captureWrites(() => {
      requestStorage.run({ requestId: 'req-1' }, () => {
        tenantStorage.run({ tenantId: 'tenant-1' }, () => logger.log('inside context'))
      })
    })
    expect(entry).toMatchObject({ requestId: 'req-1', tenantId: 'tenant-1' })
  })

  it('omits requestId/tenantId when outside any context', () => {
    const logger = new StructuredLogger(false)
    const [entry] = captureWrites(() => logger.log('outside context'))
    expect(entry?.requestId).toBeUndefined()
    expect(entry?.tenantId).toBeUndefined()
  })

  it('includes trace only for error()', () => {
    const logger = new StructuredLogger(false)
    const [entry] = captureWrites(() => logger.error('boom', 'stack-trace-here', 'SomeContext'))
    expect(entry).toMatchObject({ level: 'error', message: 'boom', trace: 'stack-trace-here' })
  })

  it('suppresses debug/verbose in production, keeps log/warn/error/fatal', () => {
    const logger = new StructuredLogger(true)
    const entries = captureWrites(() => {
      logger.debug('debug msg')
      logger.verbose('verbose msg')
      logger.log('log msg')
      logger.warn('warn msg')
      logger.error('error msg')
      logger.fatal('fatal msg')
    })
    const levels = entries.map((entry) => entry.level)
    expect(levels).toEqual(['log', 'warn', 'error', 'fatal'])
  })

  it('keeps debug/verbose outside production', () => {
    const logger = new StructuredLogger(false)
    const entries = captureWrites(() => {
      logger.debug('debug msg')
      logger.verbose('verbose msg')
    })
    expect(entries.map((entry) => entry.level)).toEqual(['debug', 'verbose'])
  })

  it('stringifies a non-string message instead of throwing', () => {
    const logger = new StructuredLogger(false)
    const [entry] = captureWrites(() => logger.log({ some: 'object' }))
    expect(entry?.message).toBe('{"some":"object"}')
  })

  it('extracts message/stack from an Error passed to error() (never JSON.stringify({}))', () => {
    const logger = new StructuredLogger(false)
    const error = new Error('boom')
    const [entry] = captureWrites(() => logger.error(error))
    expect(entry).toMatchObject({ level: 'error', message: 'boom' })
    expect(typeof entry?.trace).toBe('string')
    expect(entry?.trace).toContain('Error: boom')
  })

  it('prefers the explicit trace argument over the Error stack when both are given', () => {
    const logger = new StructuredLogger(false)
    const [entry] = captureWrites(() => logger.error(new Error('boom'), 'explicit-trace'))
    expect(entry?.trace).toBe('explicit-trace')
  })

  it('never omits the message key, even for undefined', () => {
    const logger = new StructuredLogger(false)
    const [entry] = captureWrites(() => logger.log(undefined))
    expect(entry).toHaveProperty('message')
    expect(entry?.message).toBe('undefined')
  })
})
