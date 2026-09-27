import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: true,
    proxy: {
      // Must come before /api — these admin resell routes live on port 3002
      '/api/admin/resell': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api/resell': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
    headers: {
      'Service-Worker-Allowed': '/',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  preview: {
    host: true,
    port: 5175,
    strictPort: true,
    allowedHosts: [
      'ticketmasterapp.up.railway.app',
      'verifiedfanpresale.com',
      'www.verifiedfanpresale.com',
      'https://verifiedfanpresale.com'
    ],
    proxy: {
      '/api/admin/resell': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api/resell': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
