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

const { getQueueCounts, mergeResults, calcPercentages } = await import('./results.js')
const { saveToQueue } = await import('./queue.js')

describe('mergeResults', () => {
  it('adds server results and queue counts', () => {
    const server = { 1: 10, 2: 20, 3: 5, 4: 15 }
    const queue = { 1: 2, 3: 1 }
    const merged = mergeResults(server, queue)
    expect(merged).toEqual({ 1: 12, 2: 20, 3: 6, 4: 15 })
  })

  it('handles empty queue counts', () => {
    const server = { 1: 10, 2: 20, 3: 5, 4: 15 }
    const merged = mergeResults(server, {})
    expect(merged).toEqual({ 1: 10, 2: 20, 3: 5, 4: 15 })
  })

  it('handles empty server results', () => {
    const queue = { 2: 3 }
    const merged = mergeResults({ 1: 0, 2: 0, 3: 0, 4: 0 }, queue)
    expect(merged).toEqual({ 1: 0, 2: 3, 3: 0, 4: 0 })
  })
})

describe('calcPercentages', () => {
  it('calculates correct percentages', () => {
    const merged = { 1: 50, 2: 25, 3: 15, 4: 10 }
    const { total, percentages } = calcPercentages(merged)
    expect(total).toBe(100)
    expect(percentages[0].pct).toBe(50)
    expect(percentages[1].pct).toBe(25)
    expect(percentages[2].pct).toBe(15)
    expect(percentages[3].pct).toBe(10)
  })

  it('returns 0% when total is zero', () => {
    const merged = { 1: 0, 2: 0, 3: 0, 4: 0 }
    const { total, percentages } = calcPercentages(merged)
    expect(total).toBe(0)
    percentages.forEach((p) => expect(p.pct).toBe(0))
  })

  it('rounds percentages to integers', () => {
    const merged = { 1: 1, 2: 1, 3: 1, 4: 0 }
    const { percentages } = calcPercentages(merged)
    expect(percentages[0].pct).toBe(33)
    expect(percentages[1].pct).toBe(33)
    expect(percentages[2].pct).toBe(33)
    expect(percentages[3].pct).toBe(0)
  })

  it('includes label and count from OPTIONS', () => {
    const merged = { 1: 5, 2: 3, 3: 0, 4: 2 }
    const { percentages } = calcPercentages(merged)
    expect(percentages[0].label).toBe('Eine neue Perspektive')
    expect(percentages[0].count).toBe(5)
    expect(percentages[0].id).toBe(1)
  })
})

describe('getQueueCounts', () => {
  beforeEach(clearStorage)

  it('returns empty object for empty queue', () => {
    expect(getQueueCounts()).toEqual({})
  })

  it('counts votes by option', () => {
    saveToQueue({ id: '1', option: 1, device_id: 'd' })
    saveToQueue({ id: '2', option: 1, device_id: 'd' })
    saveToQueue({ id: '3', option: 3, device_id: 'd' })
    expect(getQueueCounts()).toEqual({ 1: 2, 3: 1 })
  })
})
