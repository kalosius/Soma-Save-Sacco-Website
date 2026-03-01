import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Fast Refresh optimizations
      fastRefresh: true,
      // Use automatic JSX runtime (smaller output)
      jsxRuntime: 'automatic'
    })
    // NOTE: Removed vite-plugin-compression — Netlify handles gzip/brotli
    // automatically. The plugin was generating .gz/.br files that could
    // interfere with Netlify's own compression.
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
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-helmet-async']
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
