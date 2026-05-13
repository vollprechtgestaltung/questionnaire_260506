<script>
  import { onMount } from 'svelte'
  import { currentScreen, connectionStatus, deviceId } from '../stores/app.js'
  import { supabase, pingSupabase } from '../lib/supabase.js'
  import { QUESTION, OPTIONS, VOTE_RETRY_ATTEMPTS } from '../lib/config.js'
  import { saveToQueue } from '../lib/queue.js'
  import Header from './Header.svelte'

  let voted = false

  onMount(async () => {
    // Smoke test on mount
    const ok = await pingSupabase()
    connectionStatus.set(ok ? 'ok' : 'error')
  })

  async function submitVote(optionId) {
    if (voted) return
    voted = true
    error = null

    const vote = { id: crypto.randomUUID(), option: optionId, device_id: deviceId }

    let attempt = 0
    while (attempt < VOTE_RETRY_ATTEMPTS) {
      try {
        const { error } = await supabase.from('votes').insert(vote)

        if (!error) {
          connectionStatus.set('ok')
          currentScreen.set('result')
          return
        }

        attempt++
      } catch {
        attempt++
      }
    }

    // All retries failed — queue locally, show results anyway
    saveToQueue(vote)
    connectionStatus.set('error')
    currentScreen.set('result')
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
    padding: 0 2rem 10%;
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
    background: var(--surface);
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

</style>
