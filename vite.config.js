// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.100.13',  // konkretny adres IP
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
