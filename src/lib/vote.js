import { saveToQueue, getQueue, removeFromQueue } from './queue.js'
import { VOTE_RETRY_ATTEMPTS, VOTE_RETRY_TIMEOUT, SUBMIT_VOTE_URL } from './config.js'
import { withAbortableTimeout } from './timeout.js'

// A 4xx means the server rejected the vote permanently (e.g. malformed payload).
// Retrying or re-queuing such a vote would loop forever — this was the cause of
// the 429 retry storm. Only 5xx / network errors / timeouts are transient and
// worth retrying.
function isTerminal(status) {
  return status >= 400 && status < 500
}

function postVote(vote, signal) {
  return fetch(SUBMIT_VOTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vote),
    signal,
  })
}

export async function submitVote(vote) {
  if (!navigator.onLine) {
    saveToQueue(vote)
    return { status: 'queued', reason: 'offline' }
  }

  let attempt = 0
  while (attempt < VOTE_RETRY_ATTEMPTS) {
    try {
      const res = await withAbortableTimeout((signal) => postVote(vote, signal), VOTE_RETRY_TIMEOUT)
      if (res.ok) return { status: 'ok' }
      // Permanent rejection: do not retry, do not queue — it would never succeed.
      if (isTerminal(res.status)) return { status: 'rejected', code: res.status }
      // 5xx: transient, fall through to retry.
    } catch {
      // Network error or timeout: transient, fall through to retry.
    }
    attempt++
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
    // Success OR permanent rejection (4xx) → stop retrying this vote and drop it.
    // 5xx stays queued and retries on the next poll cycle.
    if (res.ok || isTerminal(res.status)) removeFromQueue(vote.id)
  } catch {
    // Network error or timeout → keep in queue, retry on next poll cycle.
  }
}
