<script>
  import { onMount, onDestroy } from 'svelte'
  import { currentScreen, deviceId } from '../stores/app.js'
  import { pingSupabase } from '../lib/supabase.js'
  import { submitVote as sendVote } from '../lib/vote.js'
  import { reportSuccess, reportFailure } from '../lib/connection.js'
  import { QUESTION, OPTIONS } from '../lib/config.js'
  import Header from './Header.svelte'

  let voted = $state(false)
  let submitting = $state(false)

  async function checkConnection() {
    const ok = await pingSupabase()
    if (ok) reportSuccess()
    else reportFailure()
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') checkConnection()
  }

  onMount(() => {
    checkConnection()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onDestroy(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  async function submitVote(optionId) {
    if (voted) return
    voted = true

    const vote = { id: crypto.randomUUID(), option: optionId, device_id: deviceId }

    submitting = true
    const { status } = await sendVote(vote)
    if (status === 'ok') reportSuccess()
    else reportFailure()
    submitting = false
    currentScreen.set('result')
  }
</script>

<main>
  <Header />

  <div class="question">
    <h1>{QUESTION}</h1>
  </div>

  {#if submitting}
    <div class="loader-overlay">
      <div class="spinner"></div>
    </div>
  {:else}
    <div class="options">
      {#each OPTIONS as option (option.id)}
        <button
          disabled={voted}
          onclick={() => submitVote(option.id)}
        >
          {option.label}
        </button>
      {/each}
    </div>
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

  .loader-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50vh;
  }

  .spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid var(--surface);
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

</style>
