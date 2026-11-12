import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyTargets = {
  '/api':         { target: 'http://localhost:4000', changeOrigin: true },
  '/uploads':     { target: 'http://localhost:4000', changeOrigin: true },
  '/sitemap.xml': { target: 'http://localhost:4000', changeOrigin: true },
}

export default defineConfig({
  plugins: [react()],

  server:  { port: 5173, proxy: proxyTargets },
  preview: { port: 4173, proxy: proxyTargets },

  build: {
    // Target modern browsers — smaller output, no legacy transforms
    target: 'es2020',

    // Raise warning threshold (Recharts / chart chunks are large)
    chunkSizeWarningLimit: 650,

    rollupOptions: {
      output: {
        // Fine-grained manual chunks so each heavy dep is independently cached
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          if (
            id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3-') ||
            id.includes('node_modules/victory')
          ) {
            return 'charts';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (
            id.includes('node_modules/axios') ||
            id.includes('node_modules/@tanstack/react-query')
          ) {
            return 'data';
          }
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
        // Deterministic filenames — required for immutable cache headers
        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
      },
    },
  },

})
