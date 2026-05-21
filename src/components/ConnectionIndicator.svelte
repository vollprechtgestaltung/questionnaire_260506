<script>
  import { onMount, onDestroy } from 'svelte'
  import { connectionStatus, lastFetchAt } from '../stores/app.js'
  import { formatAge } from '../lib/connection.js'

  const { showTimestamp = false } = $props()

  let now = $state(Date.now())
  let tick = null

  const staticLabels = {
    ok: 'Online',
    error: 'Verbindungsfehler',
    offline: 'Offline',
    unreachable: 'Server nicht erreichbar — WLAN prüfen'
  }

  let label = $derived.by(() => {
    if (showTimestamp && $connectionStatus === 'ok' && $lastFetchAt) {
      const age = formatAge($lastFetchAt, now)
      return age === 'soeben' ? staticLabels.ok : age
    }
    return staticLabels[$connectionStatus]
  })

  onMount(() => {
    if (showTimestamp) tick = setInterval(() => (now = Date.now()), 1000)
  })

  onDestroy(() => {
    if (tick) clearInterval(tick)
  })
</script>

<span class="indicator" data-status={$connectionStatus}>
  <span class="dot"></span>
  <span class="label">{label}</span>
</span>

<style>
  .indicator {
    position: fixed;
    bottom: calc(1rem + env(safe-area-inset-bottom));
    right: 3rem;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    opacity: 0.5;
    pointer-events: none;
    color: var(--color-dark-grey);
  }

  .indicator[data-status='error'],
  .indicator[data-status='offline'] {
    opacity: 1;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  [data-status='ok'] .dot {
    background: #48bb78;
  }
  [data-status='error'] .dot {
    background: #e53e3e;
  }
  [data-status='offline'] .dot {
    background: #ecc94b;
  }
  [data-status='unreachable'] .dot {
    background: #e53e3e;
  }

  .indicator[data-status='unreachable'] {
    opacity: 1;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .indicator {
      right: 1.5rem;
      bottom: calc(1.5rem + env(safe-area-inset-bottom));
    }
  }
</style>
