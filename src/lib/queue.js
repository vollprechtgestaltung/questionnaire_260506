const QUEUE_KEY = 'puls_vote_queue'

export function saveToQueue(vote) {
  const queue = getQueue()
  queue.push(vote)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function removeFromQueue(id) {
  const queue = getQueue().filter(v => v.id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}
