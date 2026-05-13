import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'

// Stub browser globals before importing stores (which read from localStorage at module load)
vi.stubGlobal('localStorage', {
  getItem: () => null,
  setItem: () => {}
})
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })

const { connectionStatus, consecutiveFailures, lastFetchAt } = await import('../stores/app.js')
const { reportSuccess, reportFailure, backoffDelay, formatAge } = await import('./connection.js')
const { UNREACHABLE_THRESHOLD, POLL_INTERVAL, POLL_INTERVAL_MAX } = await import('./config.js')

describe('connection', () => {
  beforeEach(() => {
    connectionStatus.set('ok')
    consecutiveFailures.set(0)
    vi.stubGlobal('navigator', { onLine: true })
  })

  it('reportSuccess sets status to ok and resets counter', () => {
    consecutiveFailures.set(3)
    connectionStatus.set('error')
    reportSuccess()
    expect(get(connectionStatus)).toBe('ok')
    expect(get(consecutiveFailures)).toBe(0)
  })

  it('reportFailure increments counter', () => {
    reportFailure()
    expect(get(consecutiveFailures)).toBe(1)
    reportFailure()
    expect(get(consecutiveFailures)).toBe(2)
  })

  it('reportFailure sets status to offline when navigator is offline', () => {
    vi.stubGlobal('navigator', { onLine: false })
    reportFailure()
    expect(get(connectionStatus)).toBe('offline')
  })

  it('reportFailure sets status to error below threshold', () => {
    reportFailure()
    expect(get(connectionStatus)).toBe('error')
  })

  it('reportFailure sets status to unreachable at threshold', () => {
    for (let i = 0; i < UNREACHABLE_THRESHOLD; i++) reportFailure()
    expect(get(consecutiveFailures)).toBe(UNREACHABLE_THRESHOLD)
    expect(get(connectionStatus)).toBe('unreachable')
  })

  it('reportSuccess after threshold returns to ok', () => {
    for (let i = 0; i < UNREACHABLE_THRESHOLD; i++) reportFailure()
    expect(get(connectionStatus)).toBe('unreachable')
    reportSuccess()
    expect(get(connectionStatus)).toBe('ok')
    expect(get(consecutiveFailures)).toBe(0)
  })
})

describe('lastFetchAt', () => {
  beforeEach(() => lastFetchAt.set(null))

  it('reportSuccess sets a timestamp', () => {
    const before = Date.now()
    reportSuccess()
    const ts = get(lastFetchAt)
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(Date.now())
  })

  it('reportFailure does not touch the timestamp', () => {
    lastFetchAt.set(12345)
    reportFailure()
    expect(get(lastFetchAt)).toBe(12345)
  })
})

describe('formatAge', () => {
  it('returns empty string for null', () => {
    expect(formatAge(null)).toBe('')
    expect(formatAge(undefined)).toBe('')
  })

  it('returns "soeben" for < 3 seconds', () => {
    const now = 1_000_000
    expect(formatAge(now - 0, now)).toBe('soeben')
    expect(formatAge(now - 2_000, now)).toBe('soeben')
  })

  it('returns "vor Xs" between 3 and 60 seconds', () => {
    const now = 1_000_000
    expect(formatAge(now - 5_000, now)).toBe('vor 5s')
    expect(formatAge(now - 30_000, now)).toBe('vor 30s')
    expect(formatAge(now - 59_000, now)).toBe('vor 59s')
  })

  it('returns "vor Xm" between 1 and 60 minutes', () => {
    const now = 1_000_000
    expect(formatAge(now - 60_000, now)).toBe('vor 1m')
    expect(formatAge(now - 90_000, now)).toBe('vor 1m')
    expect(formatAge(now - 600_000, now)).toBe('vor 10m')
  })

  it('returns "vor Xh" beyond 60 minutes', () => {
    const now = 1_000_000
    expect(formatAge(now - 3_600_000, now)).toBe('vor 1h')
    expect(formatAge(now - 7_200_000, now)).toBe('vor 2h')
  })

  it('handles future timestamps as soeben (clock skew safety)', () => {
    const now = 1_000_000
    expect(formatAge(now + 1000, now)).toBe('soeben')
  })
})

describe('backoffDelay', () => {
  it('returns base delay with 0 failures', () => {
    expect(backoffDelay(0)).toBe(POLL_INTERVAL)
  })

  it('doubles with each failure', () => {
    expect(backoffDelay(1)).toBe(POLL_INTERVAL * 2)
    expect(backoffDelay(2)).toBe(POLL_INTERVAL * 4)
    expect(backoffDelay(3)).toBe(POLL_INTERVAL * 8)
  })

  it('caps at POLL_INTERVAL_MAX', () => {
    expect(backoffDelay(20)).toBe(POLL_INTERVAL_MAX)
    expect(backoffDelay(100)).toBe(POLL_INTERVAL_MAX)
  })

  it('uses custom base and max', () => {
    expect(backoffDelay(2, 1000, 10000)).toBe(4000)
    expect(backoffDelay(5, 1000, 10000)).toBe(10000)
  })
})
