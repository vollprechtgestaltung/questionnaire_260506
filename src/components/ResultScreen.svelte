<script>
  import { onMount, onDestroy } from 'svelte'
  import { currentScreen, results, connectionStatus } from '../stores/app.js'
  import { supabase } from '../lib/supabase.js'
  import { flushQueue } from '../lib/vote.js'
  import { getQueue } from '../lib/queue.js'
  import { OPTIONS, RESET_TIMER, POLL_INTERVAL } from '../lib/config.js'
  import Header from './Header.svelte'

  let pollInterval = null
  let resetTimeout = null
  let secondsLeft = RESET_TIMER
  let animated = false
  let fetching = false

  let queueCounts = {}

  $: merged = OPTIONS.reduce((acc, o) => {
    acc[o.id] = ($results[o.id] ?? 0) + (queueCounts[o.id] ?? 0)
    return acc
  }, {})
  $: total = Object.values(merged).reduce((s, n) => s + n, 0)
  $: percentages = OPTIONS.map(o => ({
    ...o,
    count: merged[o.id] ?? 0,
    pct: total > 0 ? Math.round((merged[o.id] ?? 0) / total * 100) : 0
  }))

  function refreshQueueCounts() {
    const counts = {}
    for (const vote of getQueue()) {
      counts[vote.option] = (counts[vote.option] ?? 0) + 1
    }
    queueCounts = counts
  }

  async function fetchResults() {
    if (fetching) return
    fetching = true
    try {
      const { data, error } = await supabase.rpc('get_vote_counts')

      if (error) throw error

      const counts = { 1: 0, 2: 0, 3: 0, 4: 0 }
      data.forEach(row => { counts[row.option] = Number(row.count) })
      results.set(counts)
      connectionStatus.set('ok')
      await flushQueue()
      refreshQueueCounts()
    } catch {
      connectionStatus.set('error')
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

  onMount(async () => {
    results.set({ 1: 0, 2: 0, 3: 0, 4: 0 })
    refreshQueueCounts()
    await fetchResults()
    requestAnimationFrame(() => { animated = true })
    startResetCountdown()
    pollInterval = setInterval(fetchResults, POLL_INTERVAL)
  })

  onDestroy(() => {
    clearInterval(pollInterval)
    clearInterval(resetTimeout)
  })
</script>

<main>
  <Header />
  <div class="content">
  <div class="bars">
    {#each percentages as option}
      <div class="row">
        <div class="row-header">
          <span class="label">{option.label}</span>
          <span class="pct">{option.pct}%</span>
        </div>
        <div class="track">
          <div class="bar" style="width: {animated ? option.pct : 0}%"></div>
        </div>
      </div>
    {/each}
  </div>

  </div>
  <div class="statusbar">
    <span>{total} Antworten</span>
    <button class="skip" onclick={() => currentScreen.set('vote')}>{secondsLeft}s</button>
    <span class="connection" data-status={$connectionStatus}>
      <span class="dot"></span>
      {#if $connectionStatus === 'ok'}Online{:else if $connectionStatus === 'offline'}Offline{:else}Verbindungsfehler{/if}
    </span>
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100dvh;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 2rem 3rem;
    gap: 2rem;
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
    align-items: baseline;
  }

  .label {
    font-size: clamp(0.9rem, 2vw, 1.2rem);
    font-weight: 500;
  }

  .track {
    background: var(--surface);
    height: 2.5rem;
    overflow: hidden;
    width: 100%;
  }

  .bar {
    height: 100%;
    background: currentColor;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 0%;
  }

  .pct {
    font-size: clamp(1rem, 2vw, 1.3rem);
    font-weight: 700;
  }

  .skip {
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    text-align: center;
  }

  .statusbar {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: center;
    padding: 1rem 2rem;
    font-size: 0.85rem;
    opacity: 0.4;
  }

  .connection {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.4rem;
  }

  .connection .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  [data-status='ok'] .dot { background: #48bb78; }
  [data-status='error'] .dot { background: #e53e3e; }
  [data-status='offline'] .dot { background: #ecc94b; }
</style>
