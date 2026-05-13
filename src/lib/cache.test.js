import { describe, it, expect, beforeEach, vi } from 'vitest'

const storageMap = {}
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key) => storageMap[key] ?? null),
  setItem: vi.fn((key, value) => {
    storageMap[key] = value
  })
})

function clearStorage() {
  for (const key of Object.keys(storageMap)) delete storageMap[key]
}

const { loadCachedResults, loadCachedTimestamp, saveCachedResults } = await import('./cache.js')

describe('cache', () => {
  beforeEach(clearStorage)

  it('returns default results when nothing is cached', () => {
    expect(loadCachedResults()).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0 })
  })

  it('returns null timestamp when nothing is cached', () => {
    expect(loadCachedTimestamp()).toBeNull()
  })

  it('saves and reloads results', () => {
    const counts = { 1: 12, 2: 25, 3: 8, 4: 5 }
    saveCachedResults(counts, 1_000_000)
    expect(loadCachedResults()).toEqual(counts)
    expect(loadCachedTimestamp()).toBe(1_000_000)
  })

  it('fills in missing options with zero (defensive)', () => {
    storageMap['puls_last_results'] = JSON.stringify({ 1: 10 })
    expect(loadCachedResults()).toEqual({ 1: 10, 2: 0, 3: 0, 4: 0 })
  })

  it('returns default on corrupted JSON', () => {
    storageMap['puls_last_results'] = 'not-json'
    expect(loadCachedResults()).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0 })
  })

  it('uses Date.now() if no timestamp passed', () => {
    const before = Date.now()
    saveCachedResults({ 1: 1, 2: 0, 3: 0, 4: 0 })
    const stored = loadCachedTimestamp()
    expect(stored).toBeGreaterThanOrEqual(before)
    expect(stored).toBeLessThanOrEqual(Date.now())
  })
})
