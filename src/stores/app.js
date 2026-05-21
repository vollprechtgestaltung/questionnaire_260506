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

// Stable fingerprint from browser properties — survives localStorage clears
function browserFingerprint() {
  const raw = [
    navigator.language,
    typeof screen !== 'undefined' ? `${screen.width}x${screen.height}x${screen.colorDepth}` : '',
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency ?? 0,
  ].join('|')
  let hash = 5381
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i)
    hash = hash & hash
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

// Persistent device ID: UUID (localStorage) + browser fingerprint
function getDeviceId() {
  const key = 'puls_device_id'
  let uuid = localStorage.getItem(key)
  if (!uuid) {
    uuid = crypto.randomUUID()
    localStorage.setItem(key, uuid)
  }
  return `${uuid}-${browserFingerprint()}`
}

export const deviceId = getDeviceId()
