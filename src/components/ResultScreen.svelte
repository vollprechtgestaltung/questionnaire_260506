<script>
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import { currentScreen, results, consecutiveFailures } from '../stores/app.js'
  import { supabase } from '../lib/supabase.js'
  import { flushQueue } from '../lib/vote.js'
  import { getQueueCounts, mergeResults, calcPercentages } from '../lib/results.js'
  import { reportSuccess, reportFailure, backoffDelay } from '../lib/connection.js'
  import { saveCachedResults } from '../lib/cache.js'
  import { withAbortableTimeout } from '../lib/timeout.js'
  import { RESET_TIMER, VOTE_RETRY_TIMEOUT } from '../lib/config.js'
  import Header from './Header.svelte'
  import AppFooter from './AppFooter.svelte'
  import PublicationCode from './PublicationCode.svelte'

  let pollTimeout = null
  let resetTimeout = null
  let secondsLeft = $state(RESET_TIMER)
  let animated = $state(false)
  let fetching = false

  let queueCounts = $state({})

  let merged = $derived(mergeResults($results, queueCounts))
  let computed = $derived(calcPercentages(merged))
  let total = $derived(computed.total)
  let percentages = $derived(computed.percentages)

  function refreshQueueCounts() {
    queueCounts = getQueueCounts()
  }

  async function fetchResults() {
    if (fetching) return
    fetching = true
    try {
      const { data, error } = await withAbortableTimeout(
        (signal) => supabase.rpc('get_vote_counts').abortSignal(signal),
        VOTE_RETRY_TIMEOUT
      )

      if (error) throw error
      if (!Array.isArray(data)) throw new Error('unexpected RPC response')

      const counts = { 1: 0, 2: 0, 3: 0, 4: 0 }
      data.forEach(row => { counts[row.option] = Number(row.count) })
      results.set(counts)
      saveCachedResults(counts)
      reportSuccess()
      await flushQueue()
      refreshQueueCounts()
    } catch {
      reportFailure()
      refreshQueueCounts()
    } finally {
      fetching = false
    }
  }

  function startResetCountdown() {
    secondsLeft = RESET_TIMER
    resetTimeout = setInterval(() => {
      secondsLeft -= 1
      if (secondsLeft <= 0) {
        clearInterval(resetTimeout)
        currentScreen.set('vote')
      }
    }, 1000)
  }

  async function pollLoop() {
    await fetchResults()
    const delay = backoffDelay(get(consecutiveFailures))
    pollTimeout = setTimeout(pollLoop, delay)
  }

  function onVisibilityChange() {
    if (document.visibilityState !== 'visible') return
    clearTimeout(pollTimeout)
    pollLoop()
    clearInterval(resetTimeout)
    startResetCountdown()
  }

  function onOnline() {
    clearTimeout(pollTimeout)
    pollLoop()
  }

  function onOffline() {
    reportFailure()
    refreshQueueCounts()
  }

  onMount(() => {
    refreshQueueCounts()
    requestAnimationFrame(() => { animated = true })
    startResetCountdown()
    pollLoop()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
  })

  onDestroy(() => {
    clearTimeout(pollTimeout)
    clearInterval(resetTimeout)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  })
</script>

<main>
  <Header />
  <div class="content">
  <div class="bars">
    {#each percentages as option (option.id)}
      <div class="row">
        <div class="row-header">
          <span class="label">{option.label}</span>
          <span class="pct">{option.pct}%</span>
        </div>
        <div class="track">
          <div
            class="bar"
            role="progressbar"
            aria-valuenow={option.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="{option.label}: {option.pct}%"
            style="width: {animated ? option.pct : 0}%"
          ></div>
        </div>
      </div>
    {/each}
  </div>

  </div>
  <PublicationCode />
  <AppFooter showTimestamp={true}>
    {#snippet left()}{total} Antworten{/snippet}
    {#snippet center()}{secondsLeft}s{/snippet}
  </AppFooter>
</main>

<style>
  main {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100svh;
    color: var(--color-navy);
  }

  .content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem var(--layout-px) 3rem;
    gap: 2rem;
    overflow-y: auto;
  }

  .bars {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
    max-width: 900px;
  }

  .row {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .row-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 15vw;
  }

  .label {
    font-size: clamp(0.9rem, 2vw, 1.2rem);
    font-weight: 500;
    text-wrap: balance;
  }

  .track {
    background: var(--color-warm-grey);
    height: 2.5rem;
    overflow: hidden;
    width: 100%;
  }

  .bar {
    height: 100%;
    background: var(--color-coral);
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 0%;
  }

  .pct {
    font-size: clamp(1rem, 2vw, 1.3rem);
    font-weight: 700;
    white-space: nowrap;
    flex-shrink: 0;
  }

</style>
