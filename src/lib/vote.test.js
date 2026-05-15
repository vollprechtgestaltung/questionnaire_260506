import { describe, it, expect, beforeEach, vi } from 'vitest'
import { withAbortableTimeout } from './vote.js'

// --- localStorage mock ---
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

// --- fetch mock ---
const fetchMock = vi.fn()
let lastSignal = null
vi.stubGlobal('fetch', (url, options) => {
  lastSignal = options?.signal ?? null
  return fetchMock(url, options)
})

// Re-import after mocks are set up
const { submitVote, flushQueue } = await import('./vote.js')
const { getQueue, saveToQueue } = await import('./queue.js')

const vote = () => ({ id: 'test-uuid', option: 1, device_id: 'dev-1' })
const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 })
const errResponse = () => new Response(JSON.stringify({ error: 'fail' }), { status: 500 })

describe('withAbortableTimeout', () => {
  it('resolves when the request finishes before the timeout', async () => {
    const result = await withAbortableTimeout(async () => 'ok', 1000)
    expect(result).toBe('ok')
  })

  it('aborts the request when timeout fires', async () => {
    let capturedSignal = null
    const slow = (signal) => {
      capturedSignal = signal
      return new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')))
      })
    }
    await expect(withAbortableTimeout(slow, 50)).rejects.toThrow('aborted')
    expect(capturedSignal.aborted).toBe(true)
  })

  it('passes a non-aborted signal initially', async () => {
    let capturedSignal = null
    await withAbortableTimeout(async (signal) => {
      capturedSignal = signal
      return 'ok'
    }, 1000)
    expect(capturedSignal.aborted).toBe(false)
  })
})

describe('submitVote', () => {
  beforeEach(() => {
    clearStorage()
    fetchMock.mockReset()
    lastSignal = null
    vi.stubGlobal('navigator', { onLine: true })
  })

  it('returns ok when insert succeeds', async () => {
    fetchMock.mockResolvedValue(okResponse())
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
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retries on error and succeeds on second attempt', async () => {
    fetchMock
      .mockResolvedValueOnce(errResponse())
      .mockResolvedValueOnce(okResponse())

    const result = await submitVote(vote())
    expect(result).toEqual({ status: 'ok' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(getQueue()).toEqual([])
  })

  it('queues vote after all retries fail', async () => {
    fetchMock.mockResolvedValue(errResponse())
    const v = vote()
    const result = await submitVote(v)
    expect(result).toEqual({ status: 'queued', reason: 'retries_exhausted' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(getQueue()).toEqual([v])
  })

  it('queues vote when fetch throws', async () => {
    fetchMock.mockRejectedValue(new Error('network error'))
    const v = vote()
    const result = await submitVote(v)
    expect(result).toEqual({ status: 'queued', reason: 'retries_exhausted' })
    expect(getQueue()).toEqual([v])
  })

  it('queues vote when fetch times out', async () => {
    fetchMock.mockImplementation(
      () =>
        new Promise((_, reject) => {
          lastSignal?.addEventListener('abort', () => reject(new Error('aborted')))
        })
    )
    const v = vote()
    const result = await submitVote(v)
    expect(result).toEqual({ status: 'queued', reason: 'retries_exhausted' })
    expect(getQueue()).toEqual([v])
  }, 15000)
})

describe('flushQueue', () => {
  beforeEach(() => {
    clearStorage()
    fetchMock.mockReset()
  })

  it('flushes all votes from queue on success', async () => {
    const v1 = { id: '1', option: 1, device_id: 'd' }
    const v2 = { id: '2', option: 2, device_id: 'd' }
    saveToQueue(v1)
    saveToQueue(v2)
    fetchMock.mockResolvedValue(okResponse())

    await flushQueue()
    expect(getQueue()).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('removes vote when edge function returns ok (includes duplicate)', async () => {
    const v = { id: 'dup', option: 1, device_id: 'd' }
    saveToQueue(v)
    fetchMock.mockResolvedValue(okResponse())

    await flushQueue()
    expect(getQueue()).toEqual([])
  })

  it('keeps vote in queue on error response', async () => {
    const v = { id: 'err', option: 1, device_id: 'd' }
    saveToQueue(v)
    fetchMock.mockResolvedValue(errResponse())

    await flushQueue()
    expect(getQueue()).toEqual([v])
  })

  it('keeps vote in queue when fetch throws', async () => {
    const v = { id: 'throw', option: 1, device_id: 'd' }
    saveToQueue(v)
    fetchMock.mockRejectedValue(new Error('network'))

    await flushQueue()
    expect(getQueue()).toEqual([v])
  })

  it('does nothing on empty queue', async () => {
    await flushQueue()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
