<script>
  import ConnectionIndicator from './ConnectionIndicator.svelte'

  let { left, center, showTimestamp = false } = $props()
</script>

<footer class="app-footer">
  <span class="col">{#if left}{@render left()}{/if}</span>
  <span class="col col-center">{#if center}{@render center()}{/if}</span>
  <span class="col col-right"><ConnectionIndicator {showTimestamp} /></span>
</footer>

<style>
  .app-footer {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: center;
    min-height: var(--footer-height);
    padding: 0.5rem 3rem calc(0.5rem + env(safe-area-inset-bottom));
    font-size: 0.85rem;
    opacity: 0.4;
    color: var(--color-dark-grey);
    flex-shrink: 0;
  }

  .col-center {
    text-align: center;
  }

  .col-right {
    display: flex;
    justify-content: flex-end;
  }

  @media (max-width: 768px) {
    .app-footer {
      padding: 0.5rem 1.5rem calc(0.5rem + env(safe-area-inset-bottom));
    }
  }
</style>
