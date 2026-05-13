<script>
  import { connectionStatus } from '../stores/app.js'

  const { inline } = $props()

  const labels = {
    ok: 'Online',
    error: 'Verbindungsfehler',
    offline: 'Offline'
  }
</script>

<span class="indicator" class:fixed={!inline} data-status={$connectionStatus}>
  <span class="dot"></span>
  <span class="label">{labels[$connectionStatus]}</span>
</span>

<style>
  .indicator {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    opacity: 0.5;
    pointer-events: none;
  }

  .indicator[data-status='error'],
  .indicator[data-status='offline'] {
    opacity: 1;
  }

  .fixed {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 100;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  [data-status='ok']    .dot { background: #48bb78; }
  [data-status='error'] .dot { background: #e53e3e; }
  [data-status='offline'] .dot { background: #ecc94b; }
</style>
