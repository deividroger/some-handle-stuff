import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The API has no CORS and no /api prefix: proxy /api/* to it in dev (nginx does the same in Docker).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
