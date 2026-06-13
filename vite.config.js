import { defineConfig } from 'vite'

export default defineConfig({
  base: '/concept-book/',
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
