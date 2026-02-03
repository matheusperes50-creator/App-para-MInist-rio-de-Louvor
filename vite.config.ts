import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Garante que o process.env.API_KEY seja substituído pelo valor da variável de ambiente no build do Vercel
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  server: {
    port: 3000
  },
  build: {
    chunkSizeWarningLimit: 1000,
  }
});