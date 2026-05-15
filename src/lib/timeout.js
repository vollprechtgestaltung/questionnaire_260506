/**
 * Run a request with an abortable timeout. The request is cancelled on the
 * wire when the timeout fires — not just orphaned, as Promise.race would do.
 */
export async function withAbortableTimeout(buildRequest, ms) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await buildRequest(controller.signal)
  } finally {
    clearTimeout(timer)
  }
}
