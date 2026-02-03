
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Esta linha garante que o código no navegador reconheça a chave de API
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  server: {
    port: 3000
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-charts': ['recharts'],
          'vendor-excel': ['xlsx'],
          'vendor-ai': ['@google/genai'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
});
