import { writable } from 'svelte/store'

// Current screen: 'vote' | 'result'
export const currentScreen = writable('vote')

// Vote results: { 1: count, 2: count, 3: count, 4: count }
export const results = writable({ 1: 0, 2: 0, 3: 0, 4: 0 })

// Connection status: 'ok' | 'error' | 'offline'
export const connectionStatus = writable('ok')

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
