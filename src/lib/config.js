// Timing
export const RESET_TIMER = 20        // seconds until auto-reset to vote screen
export const POLL_INTERVAL = 2500    // ms between result polls
export const VOTE_RETRY_ATTEMPTS = 3 // retries before showing error

// Question content
export const QUESTION = 'Was verändert diese Erfahrung für Sie?'

export const OPTIONS = [
  { id: 1, label: 'Eine neue Perspektive' },
  { id: 2, label: 'Mehr Empathie' },
  { id: 3, label: 'Besseres Verständnis' },
  { id: 4, label: 'Verstärkter Handlungsbedarf' }
]
