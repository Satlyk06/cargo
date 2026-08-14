import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',  // ← EKLE: Vercel için base path
  
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        
      },
    },
  },
  build: {
    outDir: 'dist',  // ← EKLE: build çıktı klasörü
    sourcemap: false, // ← EKLE: production'da sourcemap'i kapat (opsiyonel)
     chunkSizeWarningLimit: 1000, // ← EKLE: 1000 KB (1 MB) yap
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})