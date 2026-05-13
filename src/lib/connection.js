import { get } from 'svelte/store'
import { connectionStatus, consecutiveFailures, lastFetchAt } from '../stores/app.js'
import { UNREACHABLE_THRESHOLD, POLL_INTERVAL, POLL_INTERVAL_MAX } from './config.js'

/**
 * Exponential backoff: base * 2^failures, capped at max.
 * 0 failures → base, 1 → 2x base, 2 → 4x base, etc.
 */
export function backoffDelay(failures, base = POLL_INTERVAL, max = POLL_INTERVAL_MAX) {
  return Math.min(base * Math.pow(2, failures), max)
}

/**
 * Format the age of a timestamp as a German "soeben / vor Xs / vor Xm" string.
 */
export function formatAge(timestamp, now = Date.now()) {
  if (timestamp == null) return ''
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (diffSec < 3) return 'soeben'
  if (diffSec < 60) return `vor ${diffSec}s`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `vor ${diffMin}m`
  const diffHour = Math.floor(diffMin / 60)
  return `vor ${diffHour}h`
}

export function reportSuccess() {
  consecutiveFailures.set(0)
  connectionStatus.set('ok')
  lastFetchAt.set(Date.now())
}

export function reportFailure() {
  const next = get(consecutiveFailures) + 1
  consecutiveFailures.set(next)

  if (!navigator.onLine) {
    connectionStatus.set('offline')
  } else if (next >= UNREACHABLE_THRESHOLD) {
    connectionStatus.set('unreachable')
  } else {
    connectionStatus.set('error')
  }
}
