<script>
  let dark = $state(localStorage.getItem('puls_theme') === 'dark')

  if (dark) document.documentElement.dataset.theme = 'dark'

  function toggle() {
    dark = !dark
    const theme = dark ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    localStorage.setItem('puls_theme', theme)
  }
</script>

<header>
  <span class="brand">brand name</span>
  <button class="toggle" onclick={toggle} aria-label="Theme wechseln" class:dark>
    <span class="knob"></span>
  </button>
</header>

<style>
  header {
    height: 5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    flex-shrink: 0;
  }

  .brand {
    font-size: clamp(1rem, 2.5vw, 2rem);
    font-weight: 500;
    color: var(--fg);
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
