import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      VITE_SUBMIT_VOTE_URL: 'https://test.example.com/functions/v1/submit-vote',
      VITE_SUPABASE_URL: 'https://test.example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['opzelura-icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Puls Questionnaire',
        short_name: 'Puls',
        description: 'Messe-Abstimmung',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [],
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ]
})
