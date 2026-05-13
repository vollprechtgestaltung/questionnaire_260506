<script>
  import { onMount } from 'svelte'
  import { currentScreen } from './stores/app.js'
  import VoteScreen from './components/VoteScreen.svelte'
  import ResultScreen from './components/ResultScreen.svelte'
  import ConnectionIndicator from './components/ConnectionIndicator.svelte'

  let wakeLock = null

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

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      wakeLock?.release()
    }
  })
</script>

<ConnectionIndicator />

{#if $currentScreen === 'vote'}
  <VoteScreen />
{:else if $currentScreen === 'result'}
  <ResultScreen />
{/if}

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(:root) {
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
  }

  :global(#app) {
    height: 100dvh;
  }
</style>
