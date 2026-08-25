import { describe, it, expect } from 'vitest'
import { parseContentRangeTotal, parseFlags, parsePageSize } from './ops.js'

// parseContentRangeTotal carries the truncation guard: if it silently
// returned a wrong total, a short export would pass verification.
describe('parseContentRangeTotal', () => {
  it('reads the total from a normal range', () => {
    expect(parseContentRangeTotal('0-24/606')).toBe(606)
  })

  it('reads a single-row range', () => {
    expect(parseContentRangeTotal('0-0/1')).toBe(1)
  })

  it('reads an empty table', () => {
    expect(parseContentRangeTotal('*/0')).toBe(0)
  })

  it('returns null for an unknown total rather than guessing', () => {
    expect(parseContentRangeTotal('0-24/*')).toBeNull()
  })

  it('returns null when the header is missing', () => {
    expect(parseContentRangeTotal(null)).toBeNull()
    expect(parseContentRangeTotal('')).toBeNull()
  })
})

describe('parseFlags', () => {
  it('reads key=value flags', () => {
    expect(parseFlags(['--label=pre-wipe', '--page-size=3'])).toEqual({
      label: 'pre-wipe',
      'page-size': '3'
    })
  })

  it('marks a bare flag as true', () => {
    expect(parseFlags(['--verbose'])).toEqual({ verbose: true })
  })

  it('ignores positional arguments', () => {
    expect(parseFlags(['snapshot', '-x'])).toEqual({})
  })

  it('keeps an empty value distinguishable from a bare flag', () => {
    expect(parseFlags(['--label='])).toEqual({ label: '' })
  })
})

describe('parsePageSize', () => {
  it('falls back when the flag is absent', () => {
    expect(parsePageSize(undefined, 1000)).toBe(1000)
  })

  it('accepts a positive integer', () => {
    expect(parsePageSize('3', 1000)).toBe(3)
  })

  it('rejects a bare flag without a value', () => {
    expect(() => parsePageSize(true, 1000)).toThrow(/braucht einen Wert/)
  })

  // NaN would make the pagination loop's `rows.length < pageSize` check
  // always false — an endless loop against the live API.
  it('rejects non-numeric input', () => {
    expect(() => parsePageSize('abc', 1000)).toThrow(/ganze Zahl/)
  })

  it('rejects zero and negatives', () => {
    expect(() => parsePageSize('0', 1000)).toThrow(/ganze Zahl/)
    expect(() => parsePageSize('-5', 1000)).toThrow(/ganze Zahl/)
  })

  it('rejects fractions', () => {
    expect(() => parsePageSize('2.5', 1000)).toThrow(/ganze Zahl/)
  })

  it('rejects an empty value', () => {
    expect(() => parsePageSize('', 1000)).toThrow(/ganze Zahl/)
  })
})
