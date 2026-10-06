import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import {
  CLIP_ON_DESCRIPTION,
  CLIP_ON_SHARE_IMAGE,
  CLIP_ON_SHARE_TITLE,
  CLIP_ON_TITLE,
  CLIP_ON_URL,
} from "./src/components/clip-on/seo";

const escapeAttr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * dist/clip-on.html: el index.html ya construido (mismos scripts, preloader y
 * pixel) con el head de /clip-on. WhatsApp y Facebook no ejecutan JS: sin esto
 * un link a /clip-on se previsualiza como la landing de lentes. vercel.json
 * reescribe /clip-on a este archivo; la app arranca igual y el router monta
 * la pagina.
 *
 * Cada reemplazo tiene que encontrar su tag exactamente una vez. Si alguien
 * edita el head de index.html y un tag deja de existir, el build se cae aca en
 * vez de publicar una preview a medias.
 */
const clipOnHtml = (): Plugin => ({
  name: "nocte-clip-on-html",
  apply: "build",
  enforce: "post",
  generateBundle(_options, bundle) {
    const index = bundle["index.html"];
    if (!index || index.type !== "asset") {
      this.error("clip-on.html: index.html no esta en el bundle");
    }
    let html = String(index.source);

    const swap = (pattern: RegExp, replacement: string, label: string) => {
      const matches = html.match(new RegExp(pattern.source, "g"))?.length ?? 0;
      if (matches !== 1) this.error(`clip-on.html: ${label} aparece ${matches} veces en index.html`);
      html = html.replace(pattern, replacement);
    };
    const meta = (attr: "name" | "property", key: string, value: string | null) =>
      swap(
        new RegExp(`\\s*<meta ${attr}="${key.replace(/[.:]/g, "\\$&")}" content="[^"]*"\\s*/?>`),
        value === null ? "" : `\n    <meta ${attr}="${key}" content="${escapeAttr(value)}" />`,
        key,
      );

    swap(/<title>[^<]*<\/title>/, `<title>${escapeAttr(CLIP_ON_TITLE)}</title>`, "title");
    swap(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${CLIP_ON_URL}" />`, "canonical");
    meta("name", "title", CLIP_ON_TITLE);
    meta("name", "description", CLIP_ON_DESCRIPTION);
    // Las keywords y el DC.title hablan de los lentes (y de melatonina): fuera.
    meta("name", "keywords", null);
    meta("name", "DC.title", null);
    meta("property", "og:url", CLIP_ON_URL);
    meta("property", "og:title", CLIP_ON_SHARE_TITLE);
    meta("property", "og:description", CLIP_ON_DESCRIPTION);
    meta("property", "og:image", CLIP_ON_SHARE_IMAGE.url);
    meta("property", "og:image:type", CLIP_ON_SHARE_IMAGE.type);
    meta("property", "og:image:width", String(CLIP_ON_SHARE_IMAGE.width));
    meta("property", "og:image:height", String(CLIP_ON_SHARE_IMAGE.height));
    meta("property", "og:image:alt", CLIP_ON_SHARE_IMAGE.alt);
    meta("name", "twitter:url", CLIP_ON_URL);
    meta("name", "twitter:title", CLIP_ON_SHARE_TITLE);
    meta("name", "twitter:description", CLIP_ON_DESCRIPTION);
    meta("name", "twitter:image", CLIP_ON_SHARE_IMAGE.url);
    meta("name", "twitter:image:alt", CLIP_ON_SHARE_IMAGE.alt);

    // Los JSON-LD de index.html son de los lentes, con porcentajes y reclamos
    // de sueno que no aplican al clip-on. El Product del clip-on, con su
    // precio, lo agrega la pagina al montar.
    html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");

    this.emitFile({ type: "asset", fileName: "clip-on.html", source: html });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), clipOnHtml()],
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
      // Dos entries: la landing y /cert. La pagina de certificados se sirve
      // sola, sin router ni checkout ni pixel, porque se abre escaneando un QR
      // desde el celular y con datos moviles.
      input: {
        main: path.resolve(__dirname, "index.html"),
        cert: path.resolve(__dirname, "cert.html"),
      },
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
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace', 'console.error', 'console.warn'],
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
