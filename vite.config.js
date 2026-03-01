import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react({
      // Fast Refresh optimizations
      fastRefresh: true,
      // Use automatic JSX runtime (smaller output)
      jsxRuntime: 'automatic'
    }),
    // Gzip compression for all assets
    compression({
      algorithm: 'gzip',
      threshold: 1024, // Only compress files > 1KB
      ext: '.gz'
    }),
    // Brotli compression (even smaller than gzip)
    compression({
      algorithm: 'brotliCompress',
      threshold: 1024,
      ext: '.br'
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Use esbuild for faster builds (terser removed for speed)
    minify: 'esbuild',
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core - cached forever
          if (id.includes('react-dom')) return 'react-dom';
          if (id.includes('react-router')) return 'react-router';
          if (id.includes('node_modules/react/')) return 'react';
          // Other vendor libs
          if (id.includes('react-helmet')) return 'helmet';
          // Group member portal components together
          if (id.includes('/components/Shop')) return 'shop';
          if (id.includes('/components/My') || id.includes('/components/Transactions') || id.includes('/components/Profile') || id.includes('/components/Settings')) return 'portal-tabs';
        }
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minimize CSS
    cssMinify: true,
    // Inline small assets as base64
    assetsInlineLimit: 4096
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
  }
})
