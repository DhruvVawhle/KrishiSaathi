import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
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
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-icons': ['lucide-react'],
          'charts': ['recharts']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
