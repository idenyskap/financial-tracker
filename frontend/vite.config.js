import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // sockjs-client references the Node `global` object, which doesn't exist in
  // the browser ESM context Vite serves — alias it to `globalThis` so the app
  // doesn't crash with "global is not defined" (white screen) in dev.
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        secure: false
      },
      '/api/v1': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})
