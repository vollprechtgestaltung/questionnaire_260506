#!/usr/bin/env node
// Pulls the full votes table into backups/ as CSV.
//
// Usage:  npm run snapshot
//         npm run snapshot -- --label=pre-wipe
//         npm run snapshot -- --page-size=3     (Probelauf, siehe unten)
//
// Without Point-in-Time Recovery (Free plan, ADR 2026-08-24) this export is
// the only backup that exists. The script verifies what it fetched against
// the server-side row count and aborts rather than write a silently
// truncated file. Mandatory before every DELETE on votes.
//
// Pagination and the integrity checks live in lib/snapshot-core.js and are
// covered by lib/snapshot-core.test.js.

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  projectRoot,
  loadEnv,
  requireEnv,
  restHeaders,
  parseContentRangeTotal,
  stamp,
  parseFlags,
  parsePageSize
} from './lib/ops.js'
import { collectCsv, verifyCsv, toCsv } from './lib/snapshot-core.js'

// --page-size is a rehearsal aid, not a tuning knob. The unit tests prove the
// pagination against a fake pager, i.e. against our assumption of how
// PostgREST answers Range headers. A small page size lets a handful of test
// votes walk the real multi-page path and check that assumption.
const DEFAULT_PAGE_SIZE = 1000
const TIMEOUT_MS = 30000

// Deterministic order is what makes range pagination safe: without it
// PostgREST may repeat or skip rows between pages. Votes are only ever
// appended, so ascending created_at keeps already-fetched pages stable.
const QUERY = 'select=*&order=created_at.asc,id.asc'

function fail(message) {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

async function fetchTotal(env) {
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/votes?select=id&limit=1`, {
    headers: { ...restHeaders(env.VITE_SUPABASE_ANON_KEY), Prefer: 'count=exact' },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  })
  if (!res.ok) fail(`Count fehlgeschlagen: ${res.status} ${await res.text()}`)

  const total = parseContentRangeTotal(res.headers.get('content-range'))
  if (total === null)
    fail('Server lieferte keinen Zeilen-Count — Export ohne Vergleichswert abgebrochen.')
  return total
}

async function fetchPage(env, offset, pageSize) {
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/votes?${QUERY}`, {
    headers: {
      ...restHeaders(env.VITE_SUPABASE_ANON_KEY),
      Accept: 'text/csv',
      'Range-Unit': 'items',
      Range: `${offset}-${offset + pageSize - 1}`
    },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  })
  if (!res.ok) fail(`Export fehlgeschlagen bei Offset ${offset}: ${res.status} ${await res.text()}`)

  // Safe to split on newlines: every column (uuid, int, timestamp) is
  // newline-free, so no CSV value spans two lines.
  const lines = (await res.text()).split('\n').filter((line) => line.length > 0)
  return { header: lines[0], rows: lines.slice(1) }
}

const flags = parseFlags(process.argv.slice(2))
let env
let pageSize
try {
  env = loadEnv()
  requireEnv(env, ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'])
  pageSize = parsePageSize(flags['page-size'], DEFAULT_PAGE_SIZE)
} catch (error) {
  fail(error.message)
}

const expected = await fetchTotal(env)
if (expected === 0) {
  console.log('\nTabelle votes ist leer — kein Snapshot geschrieben.\n')
  process.exit(0)
}

const collected = await collectCsv({
  fetchPage: (offset, size) => fetchPage(env, offset, size),
  pageSize
})

let summary
try {
  summary = verifyCsv({ ...collected, expected })
} catch (error) {
  fail(error.message)
}

const { date, time } = stamp()
const label = typeof flags.label === 'string' ? `-${flags.label}` : ''
const relative = join('backups', `votes-${date}-${time}${label}.csv`)

try {
  // 'wx' fails if the file exists — a snapshot is never overwritten.
  writeFileSync(join(projectRoot, relative), toCsv(collected), { flag: 'wx' })
} catch (error) {
  if (error.code === 'EEXIST') fail(`${relative} existiert bereits — nichts überschrieben.`)
  fail(`Schreiben fehlgeschlagen: ${error.message}`)
}

const createdAt = (row) => row.split(',')[3].replaceAll('"', '').slice(0, 19)
const { rows } = collected

console.log('\n✓ Snapshot geschrieben\n')
console.log(`  Datei     ${relative}`)
console.log(
  `  Zeilen    ${summary.rows}${summary.added > 0 ? ` (${summary.added} während des Exports dazugekommen)` : ''}`
)
console.log(`  IDs       ${summary.unique} eindeutig`)
if (pageSize !== DEFAULT_PAGE_SIZE) {
  // Only in rehearsal mode — the point is to see that it really paginated.
  console.log(`  Seiten    ${Math.ceil(summary.rows / pageSize)} à max. ${pageSize} Zeilen`)
}
console.log(`  Zeitraum  ${createdAt(rows[0])} … ${createdAt(rows[rows.length - 1])} UTC\n`)
