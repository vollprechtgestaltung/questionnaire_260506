// Vote submission endpoint (Edge Function — no secret, safe to expose)
export const SUBMIT_VOTE_URL = import.meta.env.VITE_SUBMIT_VOTE_URL

if (!SUBMIT_VOTE_URL) {
  throw new Error('Missing VITE_SUBMIT_VOTE_URL. Check .env file.')
}

// Timing
export const RESET_TIMER = 15 // seconds until auto-reset to vote screen
export const POLL_INTERVAL = 2500 // ms between result polls (on success)
export const POLL_INTERVAL_MAX = 30000 // ms — cap for exponential backoff
export const VOTE_RETRY_ATTEMPTS = 2 // retries before queuing locally
export const VOTE_RETRY_TIMEOUT = 3000 // ms timeout per retry attempt
export const UNREACHABLE_THRESHOLD = 5 // consecutive failures before showing captive portal warning
export const QUEUE_MAX_SIZE = 500 // max votes kept in localStorage queue; oldest dropped beyond

// Question content
export const QUESTION = 'Was verändert diese Erfahrung für Sie?'

export const OPTIONS = [
  { id: 1, label: 'Eine neue Perspektive auf Vitiligo' },
  { id: 2, label: 'Mehr Empathie im Umgang mit Patientinnen und Patienten' },
  { id: 3, label: 'Ein besseres Verständnis der psychosozialen Auswirkungen' },
  { id: 4, label: 'Ein verstärkter Handlungsbedarf in der Behandlung' }
]
