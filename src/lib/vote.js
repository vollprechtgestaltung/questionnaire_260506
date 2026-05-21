import { saveToQueue, getQueue, removeFromQueue } from './queue.js'
import { VOTE_RETRY_ATTEMPTS, VOTE_RETRY_TIMEOUT, SUBMIT_VOTE_URL } from './config.js'
import { withAbortableTimeout } from './timeout.js'

async function postVote(vote, signal) {
  const res = await fetch(SUBMIT_VOTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vote),
    signal,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function submitVote(vote) {
  if (!navigator.onLine) {
    saveToQueue(vote)
    return { status: 'queued', reason: 'offline' }
  }

  let attempt = 0
  while (attempt < VOTE_RETRY_ATTEMPTS) {
    try {
      await withAbortableTimeout((signal) => postVote(vote, signal), VOTE_RETRY_TIMEOUT)
      return { status: 'ok' }
    } catch {
      attempt++
    }
  }

  saveToQueue(vote)
  return { status: 'queued', reason: 'retries_exhausted' }
}

export async function flushQueue() {
  const queue = getQueue()
  if (queue.length === 0) return

  const vote = queue[0]
  try {
    const res = await withAbortableTimeout(
      (signal) =>
        fetch(SUBMIT_VOTE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vote),
          signal,
        }),
      VOTE_RETRY_TIMEOUT
    )
    if (res.ok) removeFromQueue(vote.id)
  } catch {
    // Will retry on next poll cycle
  }
}
