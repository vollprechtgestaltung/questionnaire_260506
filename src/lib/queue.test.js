import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveToQueue, getQueue, removeFromQueue } from './queue.js'

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
})
