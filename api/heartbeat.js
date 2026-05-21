// Vercel serverless function — keeps Supabase free-tier project alive
// by performing a lightweight read query once a day.
// Triggered by Vercel Cron (see vercel.json).

export default async function handler(request, response) {
  // Optional: verify the request comes from Vercel Cron
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.authorization
    if (auth !== `Bearer ${cronSecret}`) {
      return response.status(401).json({ ok: false, error: 'unauthorized' })
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({ ok: false, error: 'missing supabase env vars' })
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/votes?select=id&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    })

    if (!res.ok) {
      const text = await res.text()
      return response.status(502).json({ ok: false, status: res.status, body: text })
    }

    return response.status(200).json({
      ok: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return response.status(500).json({ ok: false, error: 'internal_error' })
  }
}
