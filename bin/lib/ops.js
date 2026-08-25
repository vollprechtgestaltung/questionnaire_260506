// Shared helpers for the operational CLI scripts in bin/.
// No dependencies — Node 20 globals only.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

// Minimal .env reader. The project runs on Node 20.4, which has neither
// --env-file (20.6+) nor process.loadEnvFile() (20.12+), so parse it here.
// Drop this once the engines floor moves past 20.12.
export function loadEnv(file = join(projectRoot, '.env')) {
  let raw
  try {
    raw = readFileSync(file, 'utf8')
  } catch {
    throw new Error(`.env not readable (${file}) — copy .env.example and fill it in`)
  }

  const env = {}
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq === -1) continue

    const key = trimmed
      .slice(0, eq)
      .replace(/^export\s+/, '')
      .trim()
    let value = trimmed.slice(eq + 1).trim()
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    if (quoted && value.length >= 2) value = value.slice(1, -1)

    env[key] = value
  }
  return env
}

export function requireEnv(env, keys) {
  const missing = keys.filter((key) => !env[key])
  if (missing.length) {
    throw new Error(`Missing .env variables: ${missing.join(', ')}`)
  }
}

// Never log the returned object — it carries the anon key.
export function restHeaders(key) {
  return { apikey: key, Authorization: `Bearer ${key}` }
}

// PostgREST reports the total in Content-Range as "0-24/606" or "*/0".
export function parseContentRangeTotal(value) {
  if (!value) return null
  const total = value.split('/')[1]
  if (!total || total === '*') return null
  return Number.parseInt(total, 10)
}

// Local time — matches the docs/sessions/ filename convention.
export function stamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const t = `${pad(date.getHours())}${pad(date.getMinutes())}`
  return { date: d, time: t }
}

export function parseFlags(argv) {
  const flags = {}
  for (const arg of argv) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(arg)
    if (match) flags[match[1]] = match[2] ?? true
  }
  return flags
}

// Strict on purpose: a NaN page size would make the pagination loop compare
// against NaN, never terminate, and hammer the API. Rejecting the typo is
// cheaper than debugging that during the Messe.
export function parsePageSize(raw, fallback) {
  if (raw === undefined) return fallback
  if (typeof raw !== 'string') {
    throw new Error('--page-size braucht einen Wert, z.B. --page-size=3')
  }

  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`--page-size muss eine ganze Zahl >= 1 sein (war: ${raw}).`)
  }
  return value
}
