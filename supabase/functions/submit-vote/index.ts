import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const ALLOWED_ORIGINS = [
  'https://questionnaire-260506.vercel.app',
  'http://localhost:5173',
]

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

const RATE_LIMIT_WINDOW_MS = 15_000

function json(body: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...(req ? corsHeaders(req) : {}), 'Content-Type': 'application/json' },
  })
}

function isUUID(s: unknown): s is string {
  return (
    typeof s === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  )
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, req)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400, req)
  }

  const { id, option, device_id } = body

  if (!isUUID(id)) return json({ error: 'invalid_id' }, 400, req)
  if (typeof option !== 'number' || !Number.isInteger(option) || option < 1 || option > 4)
    return json({ error: 'invalid_option' }, 400, req)
  if (typeof device_id !== 'string' || device_id.trim().length === 0)
    return json({ error: 'invalid_device_id' }, 400, req)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Rate limit: 1 vote per device_id per RATE_LIMIT_WINDOW_MS
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('device_id', device_id)
    .gte('created_at', since)

  if (count && count > 0) {
    return json({ error: 'rate_limited' }, 429, req)
  }

  const { error } = await supabase.from('votes').insert({ id, option, device_id })

  if (error && error.code !== '23505') {
    return json({ error: error.message }, 500, req)
  }

  return json({ ok: true }, 200, req)
})
