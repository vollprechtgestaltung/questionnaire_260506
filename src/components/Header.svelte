<script>
  let dark = $state(localStorage.getItem('puls_theme') === 'dark')

  $effect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  })

  function toggle() {
    dark = !dark
    localStorage.setItem('puls_theme', dark ? 'dark' : 'light')
  }
</script>

<header>
  <img class="brand" src="/opzelura.svg" alt="Opzelura" />
  <div class="toggle-wrapper" style="display:none">
    <button class="toggle" onclick={toggle} aria-label="Theme wechseln" class:dark>
      <span class="knob"></span>
    </button>
  </div>
</header>

<style>
  header {
    height: var(--header-height);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 0 var(--layout-px);
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    header {
      padding: 0 var(--layout-px);
    }
  }

  .toggle-wrapper {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .brand {
    height: var(--header-height);
    width: auto;
  }

  .toggle {
    position: relative;
    width: 3rem;
    height: 1.6rem;
    border-radius: 1rem;
    border: 2px solid rgba(128, 128, 128, 0.4);
    background: transparent;
    cursor: pointer;
    padding: 0;
  }

  .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: rgba(128, 128, 128, 0.4);
    transition: transform 0.2s ease;
  }

  .toggle.dark .knob {
    transform: translateX(1.25rem);
  }
</style>
