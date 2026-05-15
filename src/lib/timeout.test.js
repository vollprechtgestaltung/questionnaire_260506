import { describe, it, expect } from 'vitest'
import { withAbortableTimeout } from './timeout.js'

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
