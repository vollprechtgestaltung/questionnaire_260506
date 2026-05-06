<script>
  import { connectionStatus } from '../stores/app.js'

  const labels = {
    ok: 'Online',
    error: 'Verbindungsfehler',
    offline: 'Offline'
  }
</script>

<div class="indicator" data-status={$connectionStatus}>
  <span class="dot"></span>
  <span class="label">{labels[$connectionStatus]}</span>
</div>

<style>
  .indicator {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    opacity: 0.5;
    transition: opacity 0.3s;
    pointer-events: none;
    z-index: 100;
  }

  .indicator[data-status='error'],
  .indicator[data-status='offline'] {
    opacity: 1;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  [data-status='ok']    .dot { background: #48bb78; }
  [data-status='error'] .dot { background: #e53e3e; }
  [data-status='offline'] .dot { background: #ecc94b; }
</style>
