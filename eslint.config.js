import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  {
    ignores: ['dist/', 'node_modules/', 'dev-dist/']
  },
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        crypto: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        Promise: 'readonly',
        AbortController: 'readonly',
        fetch: 'readonly',
        Response: 'readonly'
      }
    }
  },
  {
    files: ['api/**/*.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        fetch: 'readonly'
      }
    }
  }
]
