import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/users': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false
      },
      '/api/products': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/api/mandi': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/api/recommendations': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/api/orders': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      },
      '/api/profile': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false
      },
      '/api/razorpay': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/api/payment': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('framer-motion')) {
            return 'motion';
          }
          if (
            id.includes('react-router') || 
            id.includes('react-dom') || 
            id.includes('react/')
          ) {
            return 'react-vendor';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
