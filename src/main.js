import App from './App.svelte'
import { mount } from 'svelte'
import { registerSW } from 'virtual:pwa-register'
import { updateAvailable } from './stores/app.js'

const app = mount(App, { target: document.getElementById('app') })

// Service worker: register and flag when an update is ready.
// The actual reload happens in App.svelte at an idle moment to avoid
// interrupting an active vote.
const updateSW = registerSW({
  onNeedRefresh() {
    updateAvailable.set(true)
  }
})

// Expose for App.svelte to trigger the actual update + reload.
export { updateSW }

export default app
