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

  base: '/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Disable modulepreload polyfill injection in production builds
    modulePreload: { polyfill: false },

    // Raise warning limit to avoid noise
    chunkSizeWarningLimit: 1000,

    rollupOptions: {},

    // Optimize build
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.logs in production
        drop_console: true,
        drop_debugger: true,
        pure_funcs: [
          'console.log',
          'console.warn',
          'console.info'
        ]
      }
    },

    sourcemap: false
  },

  // Dev server config
  server: {
    port: 5173,
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

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
    ]
  }
})
