const RESULTS_KEY = 'puls_last_results'
const TIMESTAMP_KEY = 'puls_last_fetch_at'

const DEFAULT_RESULTS = { 1: 0, 2: 0, 3: 0, 4: 0 }

/**
 * Load the last successfully-fetched server results from localStorage.
 * Used to hydrate the UI on reload so visitors do not see "0 Antworten"
 * during an offline restart.
 */
export function loadCachedResults() {
  try {
    const raw = localStorage.getItem(RESULTS_KEY)
    if (!raw) return { ...DEFAULT_RESULTS }
    const parsed = JSON.parse(raw)
    // Defensive: ensure all four options present
    return { ...DEFAULT_RESULTS, ...parsed }
  } catch {
    return { ...DEFAULT_RESULTS }
  }
}

export function loadCachedTimestamp() {
  try {
    const raw = localStorage.getItem(TIMESTAMP_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

export function saveCachedResults(results, timestamp = Date.now()) {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results))
    localStorage.setItem(TIMESTAMP_KEY, String(timestamp))
  } catch {
    // localStorage may be full or disabled; ignore — caching is best-effort
  }
}
