import { LoginAttemptTracker, MAX_LOGIN_ATTEMPTS } from './login-attempt.tracker'

describe('LoginAttemptTracker', () => {
  beforeEach(() => jest.useFakeTimers({ now: 0 }))
  afterEach(() => jest.useRealTimers())

  function fail(tracker: LoginAttemptTracker, times: number) {
    for (let i = 0; i < times; i += 1) tracker.recordFailure('t1', 'op1')
  }

  it('is not locked before reaching the limit', () => {
    const tracker = new LoginAttemptTracker()
    fail(tracker, MAX_LOGIN_ATTEMPTS - 1)
    expect(tracker.isLocked('t1', 'op1')).toBe(false)
  })

  it('locks after the fifth consecutive failure', () => {
    const tracker = new LoginAttemptTracker()
    fail(tracker, MAX_LOGIN_ATTEMPTS)
    expect(tracker.isLocked('t1', 'op1')).toBe(true)
  })

  it('unlocks when the 60s window expires', () => {
    const tracker = new LoginAttemptTracker()
    fail(tracker, MAX_LOGIN_ATTEMPTS)
    jest.setSystemTime(60_000)
    expect(tracker.isLocked('t1', 'op1')).toBe(false)
  })

  it('resets on demand (successful login)', () => {
    const tracker = new LoginAttemptTracker()
    fail(tracker, MAX_LOGIN_ATTEMPTS)
    tracker.reset('t1', 'op1')
    expect(tracker.isLocked('t1', 'op1')).toBe(false)
  })

  it('keeps counters separate per tenant and operator', () => {
    const tracker = new LoginAttemptTracker()
    fail(tracker, MAX_LOGIN_ATTEMPTS)
    expect(tracker.isLocked('t1', 'op2')).toBe(false)
    expect(tracker.isLocked('t2', 'op1')).toBe(false)
  })
})
