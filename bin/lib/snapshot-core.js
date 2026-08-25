// Pagination and the integrity guarantees for the votes export.
//
// Kept free of fetch and fs so it can be tested directly: the caller injects
// a page fetcher. These checks are the reason the export can be trusted as
// the only backup (no PITR on the Free plan — ADR 2026-08-24).

// The id is the first CSV column and is a UUID: never quoted, never contains
// a comma. That makes this split safe for this schema only.
export function rowId(row) {
  const comma = row.indexOf(',')
  return comma === -1 ? row : row.slice(0, comma)
}

// Walks pages until one comes back short. `fetchPage(offset, pageSize)` must
// resolve to { header, rows } with rows already stripped of the CSV header.
export async function collectCsv({ fetchPage, pageSize }) {
  const rows = []
  let header = null

  for (let offset = 0; ; offset += pageSize) {
    const page = await fetchPage(offset, pageSize)
    header ??= page.header
    rows.push(...page.rows)
    if (page.rows.length < pageSize) break
  }

  return { header, rows }
}

// Throws rather than return a flag: every failure here means "do not write
// this file". Returns a small summary when the export is sound.
export function verifyCsv({ header, rows, expected }) {
  if (!header) {
    throw new Error('Kein CSV-Header erhalten — Export verworfen.')
  }

  if (rows.length < expected) {
    throw new Error(
      `Nur ${rows.length} von ${expected} Zeilen erhalten — Export gekürzt, Datei NICHT geschrieben.`
    )
  }

  const ids = new Set(rows.map(rowId))
  if (ids.size !== rows.length) {
    throw new Error(
      `${rows.length} Zeilen, aber nur ${ids.size} eindeutige IDs — Duplikate, Export verworfen.`
    )
  }

  return {
    rows: rows.length,
    unique: ids.size,
    // Votes that arrived while the export was running. Harmless: ascending
    // created_at means they land at the end, never inside a fetched page.
    added: rows.length - expected
  }
}

export function toCsv({ header, rows }) {
  return `${header}\n${rows.join('\n')}\n`
}
