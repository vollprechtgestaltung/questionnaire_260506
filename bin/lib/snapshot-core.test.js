import { describe, it, expect } from 'vitest'
import { collectCsv, verifyCsv, toCsv, rowId } from './snapshot-core.js'

const HEADER = 'id,option,device_id,created_at,voted_at'

const row = (n) =>
  `0000000${String(n).padStart(4, '0')}-0000-4000-8000-000000000000,1,dev-1,"2026-08-25 10:0${n % 10}:00+00",`

// Serves `total` rows in pages, the way PostgREST does with Range headers.
const pagerFor = (total) => (offset, pageSize) => ({
  header: HEADER,
  rows: Array.from({ length: Math.max(0, Math.min(pageSize, total - offset)) }, (_, i) =>
    row(offset + i)
  )
})

describe('rowId', () => {
  it('takes the first CSV column', () => {
    expect(rowId('abc-123,1,dev-1,"2026-08-25 10:00:00+00",')).toBe('abc-123')
  })

  it('returns the whole string when there is no comma', () => {
    expect(rowId('abc-123')).toBe('abc-123')
  })
})

describe('collectCsv', () => {
  it('stops on a short page', async () => {
    const { header, rows } = await collectCsv({ fetchPage: pagerFor(7), pageSize: 10 })
    expect(header).toBe(HEADER)
    expect(rows).toHaveLength(7)
  })

  it('walks multiple full pages', async () => {
    const { rows } = await collectCsv({ fetchPage: pagerFor(25), pageSize: 10 })
    expect(rows).toHaveLength(25)
    expect(new Set(rows.map(rowId)).size).toBe(25)
  })

  it('handles an exact page-size multiple without dropping the tail', async () => {
    const { rows } = await collectCsv({ fetchPage: pagerFor(20), pageSize: 10 })
    expect(rows).toHaveLength(20)
  })

  it('returns nothing for an empty table', async () => {
    const { rows } = await collectCsv({ fetchPage: pagerFor(0), pageSize: 10 })
    expect(rows).toHaveLength(0)
  })
})

describe('verifyCsv', () => {
  const rows = [row(1), row(2), row(3)]

  it('accepts a complete export', () => {
    expect(verifyCsv({ header: HEADER, rows, expected: 3 })).toEqual({
      rows: 3,
      unique: 3,
      added: 0
    })
  })

  it('rejects a truncated export', () => {
    expect(() => verifyCsv({ header: HEADER, rows, expected: 606 })).toThrow(/gekürzt/)
  })

  it('rejects duplicate ids from bad pagination', () => {
    expect(() => verifyCsv({ header: HEADER, rows: [row(1), row(1)], expected: 2 })).toThrow(
      /Duplikate/
    )
  })

  it('rejects a missing header', () => {
    expect(() => verifyCsv({ header: null, rows, expected: 3 })).toThrow(/Header/)
  })

  it('reports votes that arrived mid-export', () => {
    expect(verifyCsv({ header: HEADER, rows, expected: 1 }).added).toBe(2)
  })
})

describe('toCsv', () => {
  it('keeps the header and ends with a newline', () => {
    const csv = toCsv({ header: HEADER, rows: [row(1), row(2)] })
    expect(csv.split('\n')[0]).toBe(HEADER)
    expect(csv.endsWith('\n')).toBe(true)
    expect(csv.trimEnd().split('\n')).toHaveLength(3)
  })
})
