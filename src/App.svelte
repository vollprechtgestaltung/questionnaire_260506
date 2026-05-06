<script>
  import { currentScreen } from './stores/app.js'
  import VoteScreen from './components/VoteScreen.svelte'
  import ResultScreen from './components/ResultScreen.svelte'
  import ConnectionIndicator from './components/ConnectionIndicator.svelte'
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
    --bg: #0a0a0a;
    --fg: #f5f5f5;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 16px;
    -webkit-tap-highlight-color: transparent;
    -webkit-text-size-adjust: 100%;
    user-select: none;
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
