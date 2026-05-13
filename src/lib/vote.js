import { supabase } from './supabase.js'
import { saveToQueue, getQueue, removeFromQueue } from './queue.js'
import { VOTE_RETRY_ATTEMPTS, VOTE_RETRY_TIMEOUT } from './config.js'

export function withTimeout(promise, ms) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), ms)
    })
  ]).finally(() => clearTimeout(timer))
}

export async function submitVote(vote) {
  if (!navigator.onLine) {
    saveToQueue(vote)
    return { status: 'queued', reason: 'offline' }
  }

  let attempt = 0
  while (attempt < VOTE_RETRY_ATTEMPTS) {
    try {
      const { error } = await withTimeout(
        supabase.from('votes').insert(vote),
        VOTE_RETRY_TIMEOUT
      )

      if (!error) return { status: 'ok' }

      attempt++
    } catch {
      attempt++
    }
  }

  saveToQueue(vote)
  return { status: 'queued', reason: 'retries_exhausted' }
}

export async function flushQueue() {
  const queue = getQueue()
  for (const vote of queue) {
    try {
      const { error } = await supabase.from('votes').insert(vote)
      if (!error || error.code === '23505') removeFromQueue(vote.id)
    } catch {
      // Will retry on next poll cycle
    }
  }
}
