import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // 💡 nie zmienia portu automatycznie (lepsza stabilność)
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 🔗 backend Express
        changeOrigin: true, // 🧠 zmienia nagłówek Host → backend akceptuje żądanie
        secure: false,      // 🔓 pozwala na HTTP (bez SSL)
        rewrite: (path) => path.replace(/^\/api/, '/api'), // 🔁 zachowuje ścieżkę
      },
    },
  },
  preview: {
    port: 4173, // 🔮 opcjonalnie, do build preview
  },
});
