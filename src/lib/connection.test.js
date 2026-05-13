import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'

// Stub browser globals before importing stores (which read from localStorage at module load)
vi.stubGlobal('localStorage', {
  getItem: () => null,
  setItem: () => {}
})
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })

const { connectionStatus, consecutiveFailures } = await import('../stores/app.js')
const { reportSuccess, reportFailure, backoffDelay } = await import('./connection.js')
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
