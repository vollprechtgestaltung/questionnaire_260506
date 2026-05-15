import { createClient } from '@supabase/supabase-js'
import { withAbortableTimeout } from './connection.js'
import { VOTE_RETRY_TIMEOUT } from './config.js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Smoke test — ping Supabase on app start.
 * Returns true if reachable, false otherwise.
 */
export async function pingSupabase() {
  try {
    const { error } = await withAbortableTimeout(
      (signal) => supabase.from('votes').select('id').limit(1).abortSignal(signal),
      VOTE_RETRY_TIMEOUT
    )
    return !error
  } catch {
    return false
  }
}
