#!/usr/bin/env node
// Short operational check for the Messe: is the backend reachable and is
// data flowing? Read-only — writes nothing, casts no vote.
//
// Usage:  npm run health
//         npm run health -- --origin=https://<vercel-domain>
//
// --origin turns the submit-vote check into a real CORS preflight against
// that origin. Without it the check only proves the function is deployed.
//
// Exit code 0 = everything green, 1 = at least one check failed.

import { loadEnv, requireEnv, restHeaders, parseContentRangeTotal, parseFlags } from './lib/ops.js'

const TIMEOUT_MS = 10000

async function timedFetch(url, options = {}) {
  const started = Date.now()
  const signal = AbortSignal.timeout(TIMEOUT_MS)
  const res = await fetch(url, { ...options, signal })
  return { res, ms: Date.now() - started }
}

function line(ok, label, detail) {
  const mark = ok ? '✓' : '✗'
  return `${mark} ${label.padEnd(16)}${detail}`
}

async function main() {
  const flags = parseFlags(process.argv.slice(2))
  const results = []
  let env

  // 1 — .env
  try {
    env = loadEnv()
    requireEnv(env, ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_SUBMIT_VOTE_URL'])
    results.push([true, '.env', 'URL, ANON_KEY, SUBMIT_VOTE_URL vorhanden'])
  } catch (error) {
    results.push([false, '.env', error.message])
    return results
  }

  // 2 + 3 — REST reachable, vote count, latest vote.
  // One request answers all three: Prefer:count=exact puts the total into
  // Content-Range, the body carries the newest row.
  const votesUrl =
    `${env.VITE_SUPABASE_URL}/rest/v1/votes` + '?select=created_at&order=created_at.desc&limit=1'
  try {
    const { res, ms } = await timedFetch(votesUrl, {
      headers: { ...restHeaders(env.VITE_SUPABASE_ANON_KEY), Prefer: 'count=exact' }
    })

    if (!res.ok) {
      const body = await res.text()
      results.push([false, 'Supabase REST', `${res.status} · ${body.slice(0, 120)}`])
    } else {
      results.push([true, 'Supabase REST', `${res.status} · ${ms} ms`])

      const total = parseContentRangeTotal(res.headers.get('content-range'))
      const rows = await res.json()
      const latest = rows[0]?.created_at
      const detail =
        total === 0 || !latest
          ? '0 Zeilen · noch kein Vote'
          : `${total} Zeilen · letzter Vote ${latest.replace('T', ' ').slice(0, 19)} UTC`
      results.push([true, 'votes', detail])
    }
  } catch (error) {
    results.push([false, 'Supabase REST', error.message])
  }

  // 4 — submit-vote Edge Function. OPTIONS only, so no vote is written.
  try {
    const headers = { 'Access-Control-Request-Method': 'POST' }
    if (typeof flags.origin === 'string') headers.Origin = flags.origin

    const { res, ms } = await timedFetch(env.VITE_SUBMIT_VOTE_URL, { method: 'OPTIONS', headers })
    const allowOrigin = res.headers.get('access-control-allow-origin')

    if (res.status >= 500) {
      results.push([false, 'submit-vote', `${res.status} · Function antwortet mit Serverfehler`])
    } else if (typeof flags.origin === 'string') {
      const corsOk = allowOrigin === flags.origin || allowOrigin === '*'
      results.push([
        corsOk,
        'submit-vote',
        corsOk
          ? `${res.status} · CORS erlaubt ${flags.origin}`
          : `${res.status} · CORS verweigert ${flags.origin} (allow-origin: ${allowOrigin ?? 'nicht gesetzt'})`
      ])
    } else {
      results.push([
        true,
        'submit-vote',
        `${res.status} · erreichbar (${ms} ms) · CORS ungeprüft, siehe --origin`
      ])
    }
  } catch (error) {
    results.push([false, 'submit-vote', error.message])
  }

  return results
}

const results = await main()
const now = new Date().toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })

console.log(`\npuls-questionnaire — Health-Check · ${now}\n`)
for (const [ok, label, detail] of results) console.log(line(ok, label, detail))

const failed = results.filter(([ok]) => !ok).length
console.log(failed === 0 ? '\nAlles grün.\n' : `\n${failed} Check(s) rot.\n`)
process.exit(failed === 0 ? 0 : 1)
