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

    rollupOptions: {
      output: {
        manualChunks: (id) => {

          // ── CHUNK 1: React core ──
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router')
          ) {
            return 'react-vendor'
          }

          // ── CHUNK 2: Firebase ────
          if (
            id.includes('node_modules/firebase') ||
            id.includes('node_modules/@firebase')
          ) {
            return 'firebase-vendor'
          }

          // ── CHUNK 3: Ant Design ──
          // Biggest offender ~2MB
          if (
            id.includes('node_modules/antd') ||
            id.includes('node_modules/@ant-design') ||
            id.includes('node_modules/rc-')
          ) {
            return 'antd-vendor'
          }

          // ── CHUNK 4: Mantine ─────
          if (
            id.includes('node_modules/@mantine') ||
            id.includes('node_modules/@emotion')
          ) {
            return 'mantine-vendor'
          }

          // ── CHUNK 5: Charts ──────
          if (
            id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3-') ||
            id.includes('node_modules/victory')
          ) {
            return 'charts-vendor'
          }

          // ── CHUNK 6: Animation ───
          if (
            id.includes('node_modules/framer-motion') ||
            id.includes('node_modules/motion')
          ) {
            return 'motion-vendor'
          }

          // ── CHUNK 7: UI Utils ────
          if (
            id.includes('node_modules/@headlessui') ||
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/react-icons')
          ) {
            return 'ui-vendor'
          }

          // ── CHUNK 8: PDF / Heavy utils ──
          if (
            id.includes('node_modules/jspdf') ||
            id.includes('node_modules/html2canvas') ||
            id.includes('node_modules/gsap')
          ) {
            return 'pdf-vendor'
          }

          // ── CHUNK 9: Toast/Notifications ──
          if (
            id.includes('node_modules/react-toastify') ||
            id.includes('node_modules/react-hot-toast')
          ) {
            return 'toast-vendor'
          }

          // ── CHUNK 10: HTTP/Data ──
          if (
            id.includes('node_modules/axios') ||
            id.includes('node_modules/mongoose')
          ) {
            return 'data-vendor'
          }

          // ── CHUNK 11: Radix/Shadcn/Base UI ──
          if (
            id.includes('node_modules/@radix-ui') ||
            id.includes('node_modules/radix-ui') ||
            id.includes('node_modules/@base-ui') ||
            id.includes('node_modules/shadcn') ||
            id.includes('node_modules/class-variance-authority') ||
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/tailwind-merge')
          ) {
            return 'radix-vendor'
          }

          // ── CHUNK 12: Everything else ──
          if (id.includes('node_modules/')) {
            return 'vendor-misc'
          }
        }
      }
    },

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
