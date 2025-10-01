// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // pozwala testować po LAN, ale nie wymusza IP
    port: 5173,
    strictPort: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        // Zostaw prefix /api (backend też używa /api/...)
        rewrite: (p) => p.replace(/^\/api/, '/api'),
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
  },
  resolve: {
    alias: { '@': '/src' },
  },
})
