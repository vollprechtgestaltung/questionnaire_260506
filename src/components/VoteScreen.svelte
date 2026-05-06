<script>
  import { onMount } from 'svelte'
  import { currentScreen, connectionStatus, deviceId } from '../stores/app.js'
  import { supabase, pingSupabase } from '../lib/supabase.js'
  import { QUESTION, OPTIONS, VOTE_RETRY_ATTEMPTS } from '../lib/config.js'
  import Header from './Header.svelte'

  let voted = false
  let error = null
  let wakeLock = null

  // Wake Lock — keep screen on (iOS 16.4+)
  async function acquireWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen')
      } catch {
        // Wake Lock not available — handled via iPad settings
      }
    }
  }

  onMount(async () => {
    await acquireWakeLock()

    // Smoke test on mount
    const ok = await pingSupabase()
    connectionStatus.set(ok ? 'ok' : 'error')

    // Re-acquire Wake Lock if document becomes visible again
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        await acquireWakeLock()
      }
    })

    return () => {
      wakeLock?.release()
    }
  })

  async function submitVote(optionId) {
    if (voted) return
    voted = true
    error = null

    let attempt = 0
    while (attempt < VOTE_RETRY_ATTEMPTS) {
      try {
        const { error: dbError } = await supabase.from('votes').insert({
          id: crypto.randomUUID(),
          option: optionId,
          device_id: deviceId
        })

        if (!dbError) {
          connectionStatus.set('ok')
          currentScreen.set('result')
          return
        }

        attempt++
      } catch {
        attempt++
      }
    }

    // All retries failed
    connectionStatus.set('error')
    error = 'Abstimmung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.'
    voted = false
  }
</script>

<main>
  <Header />

  <div class="question">
    <h1>{QUESTION}</h1>
  </div>

  <div class="options">
    {#each OPTIONS as option}
      <button
        disabled={voted}
        onclick={() => submitVote(option.id)}
      >
        {option.label}
      </button>
    {/each}
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100dvh;
  }

  .question {
    height: calc(50vh - 5rem);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 2rem;
  }

  h1 {
    font-size: clamp(1.5rem, 4vw, 3rem);
    text-align: center;
    font-weight: 600;
    max-width: 60ch;
  }

  .options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100vw;
    background: var(--bg);
    gap: 0;
    padding: 4px;
  }

  button {
    width: 100%;
    height: 25vh;
    font-size: clamp(1rem, 2.5vw, 2rem);
    font-weight: 500;
    color: inherit;
    border: 2px solid var(--bg);
    background: rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    text-align: center;
    line-height: 1.3;
  }

  button:not(:disabled):active {
    background: currentColor;
    color: var(--bg);
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .error {
    color: #e53e3e;
    text-align: center;
    font-size: 1rem;
  }
</style>
