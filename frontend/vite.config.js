import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls to Django during development
    // This means /api/... in the browser goes to Django at :8000
    // No CORS issues during development
    proxy: {
      '/api': {
        target:       'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
