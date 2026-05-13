import { get } from 'svelte/store'
import { connectionStatus, consecutiveFailures } from '../stores/app.js'
import { UNREACHABLE_THRESHOLD, POLL_INTERVAL, POLL_INTERVAL_MAX } from './config.js'

/**
 * Exponential backoff: base * 2^failures, capped at max.
 * 0 failures → base, 1 → 2x base, 2 → 4x base, etc.
 */
export function backoffDelay(failures, base = POLL_INTERVAL, max = POLL_INTERVAL_MAX) {
  return Math.min(base * Math.pow(2, failures), max)
}

export function reportSuccess() {
  consecutiveFailures.set(0)
  connectionStatus.set('ok')
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
