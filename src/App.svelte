<script>
  import { onMount } from 'svelte'
  import { currentScreen, updateAvailable } from './stores/app.js'
  import VoteScreen from './components/VoteScreen.svelte'
  import ResultScreen from './components/ResultScreen.svelte'
  import ConnectionIndicator from './components/ConnectionIndicator.svelte'

  let wakeLock = null

  function handleError(error) {
    console.error('App crash:', error)
    setTimeout(() => window.location.reload(), 3000)
  }

  // Reload only when on vote screen and idle — never mid-vote.
  // Updates wait until the natural reset cycle brings us back to vote.
  $effect(() => {
    if ($updateAvailable && $currentScreen === 'vote') {
      window.location.reload()
    }
  })

  async function acquireWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen')
      } catch {
        // Wake Lock not available — handled via iPad settings
      }
    }
  }

  onMount(() => {
    acquireWakeLock()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') acquireWakeLock()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', acquireWakeLock)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', acquireWakeLock)
      wakeLock?.release()
    }
  })
</script>

<svelte:boundary onerror={handleError}>
  {#if $currentScreen === 'vote'}
    <ConnectionIndicator />
    <VoteScreen />
  {:else if $currentScreen === 'result'}
    <ConnectionIndicator showTimestamp={true} />
    <ResultScreen />
  {/if}

  {#snippet failed(_error, _reset)}
    <main class="error-screen">
      <p>Ein Fehler ist aufgetreten.</p>
      <p>App wird neu geladen…</p>
    </main>
  {/snippet}
</svelte:boundary>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(:root) {
    --header-height: 8rem;

    --color-navy: #2D2850;
    --color-blue-teal: #1D8190;
    --color-light-blue: #ECF4F9;
    --color-blue: #A2C7E1;
    --color-coral: #F15D5E;
    --color-warm-grey: #D8D4D7;
    --color-dark-grey: #837c89;

    --bg: #f5f5f5;
    --fg: #0a0a0a;
    --surface: rgba(0, 0, 0, 0.08);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 16px;
    -webkit-tap-highlight-color: transparent;
    -webkit-text-size-adjust: 100%;
    user-select: none;
  }

  :global(:root[data-theme="dark"]) {
    --bg: #0a0a0a;
    --fg: #f5f5f5;
    --surface: rgba(255, 255, 255, 0.1);
  }

  :global(body) {
    background: var(--bg);
    color: var(--fg);
    height: 100dvh;
    overflow: hidden;
    overscroll-behavior: none;
    touch-action: manipulation;
    -webkit-touch-callout: none;
  }

  :global(#app) {
    height: 100dvh;
  }

  .error-screen {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1.2rem;
    opacity: 0.5;
  }
</style>
