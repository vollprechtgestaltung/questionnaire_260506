import { describe, it, expect, beforeEach, vi } from 'vitest'
import { withTimeout } from './vote.js'

// --- localStorage mock ---
const storageMap = {}
vi.stubGlobal('localStorage', {
  getItem: vi.fn(key => storageMap[key] ?? null),
  setItem: vi.fn((key, value) => { storageMap[key] = value }),
})

function clearStorage() {
  for (const key of Object.keys(storageMap)) delete storageMap[key]
}

// --- supabase mock ---
const insertMock = vi.fn()
vi.mock('./supabase.js', () => ({
  supabase: {
    from: () => ({ insert: insertMock })
  }
}))

// Re-import after mocks are set up
const { submitVote, flushQueue } = await import('./vote.js')
const { getQueue, saveToQueue } = await import('./queue.js')

const vote = () => ({ id: 'test-uuid', option: 1, device_id: 'dev-1' })

describe('withTimeout', () => {
  it('resolves if promise is faster than timeout', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 1000)
    expect(result).toBe('ok')
  })

  it('rejects if promise is slower than timeout', async () => {
    const slow = new Promise(resolve => setTimeout(() => resolve('late'), 500))
    await expect(withTimeout(slow, 50)).rejects.toThrow('timeout')
  })
})

describe('submitVote', () => {
  beforeEach(() => {
    clearStorage()
    insertMock.mockReset()
    vi.stubGlobal('navigator', { onLine: true })
  })

  it('returns ok when insert succeeds', async () => {
    insertMock.mockResolvedValue({ error: null })
    const result = await submitVote(vote())
    expect(result).toEqual({ status: 'ok' })
    expect(getQueue()).toEqual([])
  })

  it('queues vote immediately when offline', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const v = vote()
    const result = await submitVote(v)
    expect(result).toEqual({ status: 'queued', reason: 'offline' })
    expect(getQueue()).toEqual([v])
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('retries on error and succeeds on second attempt', async () => {
    insertMock
      .mockResolvedValueOnce({ error: { message: 'fail' } })
      .mockResolvedValueOnce({ error: null })

    const result = await submitVote(vote())
    expect(result).toEqual({ status: 'ok' })
    expect(insertMock).toHaveBeenCalledTimes(2)
    expect(getQueue()).toEqual([])
  })

  it('queues vote after all retries fail', async () => {
    insertMock.mockResolvedValue({ error: { message: 'fail' } })
    const v = vote()
    const result = await submitVote(v)
    expect(result).toEqual({ status: 'queued', reason: 'retries_exhausted' })
    expect(insertMock).toHaveBeenCalledTimes(3)
    expect(getQueue()).toEqual([v])
  })

  it('queues vote when insert throws', async () => {
    insertMock.mockRejectedValue(new Error('network error'))
    const v = vote()
    const result = await submitVote(v)
    expect(result).toEqual({ status: 'queued', reason: 'retries_exhausted' })
    expect(getQueue()).toEqual([v])
  })

  it('queues vote when insert times out', async () => {
    insertMock.mockImplementation(() => new Promise(() => {})) // never resolves
    const v = vote()
    const result = await submitVote(v)
    expect(result).toEqual({ status: 'queued', reason: 'retries_exhausted' })
    expect(getQueue()).toEqual([v])
  }, 15000)
})

describe('flushQueue', () => {
  beforeEach(() => {
    clearStorage()
    insertMock.mockReset()
  })

  it('flushes all votes from queue on success', async () => {
    const v1 = { id: '1', option: 1, device_id: 'd' }
    const v2 = { id: '2', option: 2, device_id: 'd' }
    saveToQueue(v1)
    saveToQueue(v2)
    insertMock.mockResolvedValue({ error: null })

    await flushQueue()
    expect(getQueue()).toEqual([])
    expect(insertMock).toHaveBeenCalledTimes(2)
  })

  it('removes vote on UNIQUE violation (23505)', async () => {
    const v = { id: 'dup', option: 1, device_id: 'd' }
    saveToQueue(v)
    insertMock.mockResolvedValue({ error: { code: '23505', message: 'duplicate' } })

    await flushQueue()
    expect(getQueue()).toEqual([])
  })

  it('keeps vote in queue on other errors', async () => {
    const v = { id: 'err', option: 1, device_id: 'd' }
    saveToQueue(v)
    insertMock.mockResolvedValue({ error: { code: '42000', message: 'other' } })

    await flushQueue()
    expect(getQueue()).toEqual([v])
  })

  it('keeps vote in queue when insert throws', async () => {
    const v = { id: 'throw', option: 1, device_id: 'd' }
    saveToQueue(v)
    insertMock.mockRejectedValue(new Error('network'))

    await flushQueue()
    expect(getQueue()).toEqual([v])
  })

  it('does nothing on empty queue', async () => {
    await flushQueue()
    expect(insertMock).not.toHaveBeenCalled()
  })
})
