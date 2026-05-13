import { QUEUE_MAX_SIZE } from './config.js'

const QUEUE_KEY = 'puls_vote_queue'

/**
 * Save a vote to the FIFO queue. If the queue would exceed QUEUE_MAX_SIZE,
 * the oldest entries are dropped. If localStorage throws a quota error
 * (iOS limits to a few MB), the queue is trimmed and retried.
 */
export function saveToQueue(vote) {
  let queue = getQueue()
  queue.push(vote)
  if (queue.length > QUEUE_MAX_SIZE) {
    queue = queue.slice(-QUEUE_MAX_SIZE)
  }
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // Likely QuotaExceededError. Halve the queue (keep newest) and retry once.
    queue = queue.slice(-Math.floor(QUEUE_MAX_SIZE / 2))
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    } catch {
      // Give up silently — losing a vote is preferable to crashing the app.
    }
  }
}

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function removeFromQueue(id) {
  const queue = getQueue().filter((v) => v.id !== id)
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // Ignore — removing should never fail meaningfully
  }
}
