import { OPTIONS } from './config.js'
import { getQueue } from './queue.js'

export function getQueueCounts() {
  const counts = {}
  for (const vote of getQueue()) {
    counts[vote.option] = (counts[vote.option] ?? 0) + 1
  }
  return counts
}

export function mergeResults(serverResults, queueCounts) {
  return OPTIONS.reduce((acc, o) => {
    acc[o.id] = (serverResults[o.id] ?? 0) + (queueCounts[o.id] ?? 0)
    return acc
  }, {})
}

export function calcPercentages(merged) {
  const total = Object.values(merged).reduce((s, n) => s + n, 0)
  return {
    total,
    percentages: OPTIONS.map((o) => ({
      ...o,
      count: merged[o.id] ?? 0,
      pct: total > 0 ? Math.round(((merged[o.id] ?? 0) / total) * 100) : 0
    }))
  }
}
