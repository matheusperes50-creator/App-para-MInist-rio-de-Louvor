
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    // Aumenta o limite para 1600kb para acomodar as dependências de análise de dados
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Estratégia de manual chunks para otimizar o carregamento e cache
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
