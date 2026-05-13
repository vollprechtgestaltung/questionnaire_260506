import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveToQueue, getQueue, removeFromQueue } from './queue.js'
import { QUEUE_MAX_SIZE } from './config.js'

const QUEUE_KEY = 'puls_vote_queue'

const storageMap = {}
const localStorageMock = {
  getItem: vi.fn((key) => storageMap[key] ?? null),
  setItem: vi.fn((key, value) => {
    storageMap[key] = value
  })
}

vi.stubGlobal('localStorage', localStorageMock)

function clearStorage() {
  for (const key of Object.keys(storageMap)) delete storageMap[key]
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
}

describe('queue', () => {
  beforeEach(clearStorage)

  it('starts empty', () => {
    expect(getQueue()).toEqual([])
  })

  it('saves a vote and retrieves it', () => {
    const vote = { id: 'abc-123', option: 1, device_id: 'dev-1' }
    saveToQueue(vote)
    expect(getQueue()).toEqual([vote])
  })

  it('appends multiple votes in order', () => {
    const v1 = { id: '1', option: 1, device_id: 'd' }
    const v2 = { id: '2', option: 2, device_id: 'd' }
    saveToQueue(v1)
    saveToQueue(v2)
    expect(getQueue()).toEqual([v1, v2])
  })

  it('removes a vote by id', () => {
    const v1 = { id: '1', option: 1, device_id: 'd' }
    const v2 = { id: '2', option: 2, device_id: 'd' }
    saveToQueue(v1)
    saveToQueue(v2)
    removeFromQueue('1')
    expect(getQueue()).toEqual([v2])
  })

  it('removing non-existent id does nothing', () => {
    const v1 = { id: '1', option: 1, device_id: 'd' }
    saveToQueue(v1)
    removeFromQueue('999')
    expect(getQueue()).toEqual([v1])
  })

  it('handles corrupted localStorage gracefully', () => {
    storageMap[QUEUE_KEY] = 'not-json!!!'
    expect(getQueue()).toEqual([])
  })

  it('caps the queue at QUEUE_MAX_SIZE, dropping oldest entries', () => {
    for (let i = 0; i < QUEUE_MAX_SIZE + 10; i++) {
      saveToQueue({ id: `v${i}`, option: 1, device_id: 'd' })
    }
    const queue = getQueue()
    expect(queue.length).toBe(QUEUE_MAX_SIZE)
    // Oldest 10 should be dropped; newest entry should be the last one we added
    expect(queue[0].id).toBe('v10')
    expect(queue[queue.length - 1].id).toBe(`v${QUEUE_MAX_SIZE + 9}`)
  })

  it('handles quota exceeded by trimming the queue and retrying', () => {
    let throwOnce = true
    localStorageMock.setItem.mockImplementation((key, value) => {
      if (throwOnce) {
        throwOnce = false
        const err = new Error('QuotaExceededError')
        err.name = 'QuotaExceededError'
        throw err
      }
      storageMap[key] = value
    })

    // Pre-populate queue near limit
    for (let i = 0; i < QUEUE_MAX_SIZE; i++) {
      storageMap[QUEUE_KEY] = JSON.stringify(
        (storageMap[QUEUE_KEY] ? JSON.parse(storageMap[QUEUE_KEY]) : []).concat({
          id: `pre${i}`,
          option: 1,
          device_id: 'd'
        })
      )
    }

    saveToQueue({ id: 'new', option: 2, device_id: 'd' })
    const queue = getQueue()
    // Should be trimmed to half the max
    expect(queue.length).toBeLessThanOrEqual(Math.floor(QUEUE_MAX_SIZE / 2))
    // Newest entry should still be there
    expect(queue.some((v) => v.id === 'new')).toBe(true)
  })
})
