import { writable } from 'svelte/store'
import { loadCachedResults, loadCachedTimestamp } from '../lib/cache.js'

// Current screen: 'vote' | 'result'
export const currentScreen = writable('vote')

// Vote results: { 1: count, 2: count, 3: count, 4: count }
// Hydrated from localStorage so visitors don't see "0 Antworten" after
// an offline reload (e.g. iPad wake-from-standby during MiFi hiccup).
export const results = writable(loadCachedResults())

// Connection status: 'ok' | 'error' | 'offline' | 'unreachable'
export const connectionStatus = writable('ok')

// Counter of consecutive backend failures (used for captive portal detection)
export const consecutiveFailures = writable(0)

// True when a new service worker is waiting; app should reload at next idle moment
export const updateAvailable = writable(false)

// Unix timestamp (ms) of the last successful Supabase response. Used to display
// "vor Xs" on the result screen. Hydrated from cache so the age label stays
// honest across reloads.
export const lastFetchAt = writable(loadCachedTimestamp())

// Persistent device ID — generated once, stored in localStorage
function getDeviceId() {
  const key = 'puls_device_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export const deviceId = getDeviceId()
