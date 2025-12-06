import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ["**/*.MP4"],
  build: {
    // Output directory
    outDir: 'dist',
    // Generate sourcemaps for production (useful for debugging)
    sourcemap: false,
    // Asset handling - increased for better performance
    assetsInlineLimit: 8192, // 8kb - inline small assets as base64
    // Rollup options - Aggressive code splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React vendors
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-core';
          }
          // React Router
          if (id.includes('node_modules/react-router-dom')) {
            return 'react-router';
          }
          // Framer Motion (heavy library)
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          // All Radix UI components (lazy loaded components)
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          // Stripe vendors
          if (id.includes('node_modules/@stripe')) {
            return 'stripe';
          }
          // Heroicons
          if (id.includes('node_modules/@heroicons')) {
            return 'heroicons';
          }
          // TanStack Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }
        },
        // Optimize asset naming
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
        passes: 3, // More aggressive compression
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true,
    // Target modern browsers for better optimization
    target: 'es2020',
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      '@tanstack/react-query',
    ],
    // Exclude large libraries that should be code-split
    exclude: ['@stripe/stripe-js'],
  },
});
