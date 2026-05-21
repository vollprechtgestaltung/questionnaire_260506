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

  function onOffline() {
    reportFailure()
  }

  onMount(() => {
    checkConnection()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', onOffline)
  })

  onDestroy(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('online', checkConnection)
    window.removeEventListener('offline', onOffline)
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
    <div class="loader-overlay" role="status" aria-label="Antwort wird gespeichert">
      <div class="spinner" aria-hidden="true"></div>
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
    height: 100svh;
  }

  .question {
    height: calc(40vh - var(--header-height));
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 2rem;
  }

  h1 {
    font-size: clamp(1.5rem, 4vw, 2.75rem);
    text-align: center;
    font-weight: 600;
    max-width: 60ch;
    color: var(--color-navy);
    margin-bottom: calc(var(--header-height) / 3);
  }

  .options {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    width: 100vw;
    background: var(--bg);
    gap: 1px;
    padding: 0 3rem 3rem;
    box-sizing: border-box;
  }

  button {
    width: 100%;
    height: 100%;
    font-size: clamp(1rem, 2.5vw, 1.666rem);
    font-weight: 500;
    color: #ffffff;
    border: none;
    background: var(--color-blue-teal);
    cursor: pointer;
    transition: background 0.15s;
    text-align: center;
    line-height: 1.3;
    padding: 3rem 5rem;
  }

  button:nth-child(1) { border-top-left-radius: 1.5rem; }
  button:nth-child(2) { border-top-right-radius: 1.5rem; }
  button:nth-child(3) { border-bottom-left-radius: 1.5rem; }
  button:nth-child(4) { border-bottom-right-radius: 1.5rem; }

  button:not(:disabled):active {
    background: var(--color-coral);
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

  @media (max-width: 768px) {
    .question {
      flex: 1;
      height: auto;
      padding: 0 4.5rem;
    }

    h1 {
      font-size: clamp(1.75rem, 5vw, 2rem);
      line-height: 1.2;
    }

    .options {
      flex: none;
      grid-template-columns: 1fr;
      grid-template-rows: repeat(4, 1fr);
      padding: 0 1.5rem 3.5rem;
      height: 60svh;
    }

    button:nth-child(1) { border-radius: 1.5rem 1.5rem 0 0; }
    button:nth-child(2) { border-radius: 0; }
    button:nth-child(3) { border-radius: 0; }
    button:nth-child(4) { border-radius: 0 0 1.5rem 1.5rem; }

    button {
      padding: 0.75rem 3rem;
      font-size: clamp(1rem, 3vw, 1.666rem);
    }
  }

</style>
