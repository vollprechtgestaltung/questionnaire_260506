<script>
  import { onMount, onDestroy } from 'svelte'
  import { currentScreen, results, connectionStatus } from '../stores/app.js'
  import { supabase } from '../lib/supabase.js'
  import { OPTIONS, RESET_TIMER, POLL_INTERVAL } from '../lib/config.js'

  let pollInterval = null
  let resetTimeout = null
  let secondsLeft = RESET_TIMER

  // Derived: total votes and percentages
  $: total = Object.values($results).reduce((s, n) => s + n, 0)
  $: percentages = OPTIONS.map(o => ({
    ...o,
    count: $results[o.id] ?? 0,
    pct: total > 0 ? Math.round(($results[o.id] ?? 0) / total * 100) : 0
  }))

  async function fetchResults() {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('option')

      if (error) throw error

      const counts = { 1: 0, 2: 0, 3: 0, 4: 0 }
      data.forEach(row => { counts[row.option] = (counts[row.option] ?? 0) + 1 })
      results.set(counts)
      connectionStatus.set('ok')
    } catch {
      connectionStatus.set('error')
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
    await fetchResults()
    startResetCountdown()
    pollInterval = setInterval(fetchResults, POLL_INTERVAL)
  })

  onDestroy(() => {
    clearInterval(pollInterval)
    clearInterval(resetTimeout)
  })
</script>

<main>
  <div class="bars">
    {#each percentages as option}
      <div class="row">
        <span class="label">{option.label}</span>
        <div class="track">
          <div class="bar" style="width: {option.pct}%"></div>
        </div>
        <span class="pct">{option.pct}%</span>
      </div>
    {/each}
  </div>

  <p class="reset-hint">Weiter in {secondsLeft}s</p>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100dvh;
    padding: 3rem 4rem;
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
    display: grid;
    grid-template-columns: 1fr 2fr auto;
    align-items: center;
    gap: 1.5rem;
  }

  .label {
    font-size: clamp(0.9rem, 2vw, 1.2rem);
    font-weight: 500;
    text-align: right;
  }

  .track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.25rem;
    height: 2.5rem;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    background: currentColor;
    border-radius: 0.25rem;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 0%;
  }

  .pct {
    font-size: clamp(1rem, 2vw, 1.3rem);
    font-weight: 700;
    min-width: 3.5ch;
    text-align: right;
  }

  .reset-hint {
    font-size: 0.85rem;
    opacity: 0.4;
    margin-top: 1rem;
  }
</style>
