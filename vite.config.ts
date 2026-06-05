import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),

    // ── PWA: offline support + asset caching ─────────────────────────────────
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "logo.png", "hero-students.webp", "robots.txt"],
      manifest: {
        name: "Talentika — Discover Your Full Potential",
        short_name: "Talentika",
        description: "Platform minat bakat & karir untuk generasi muda Indonesia",
        theme_color: "#1D4ED8",
        background_color: "#0F172A",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/logo.png", sizes: "192x192", type: "image/png" },
          { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        // Don't cache Supabase API calls or auth — always fresh
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\/auth/, /^\/admin/],
        runtimeCaching: [
          {
            // Articles: cache for 1 day (content doesn't change often)
            urlPattern: /https:\/\/doogbcrodipaeahgbjuj\.supabase\.co\/rest\/v1\/articles/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "articles-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          {
            // Learning content: cache for 1 day
            urlPattern: /https:\/\/doogbcrodipaeahgbjuj\.supabase\.co\/rest\/v1\/learning_content/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "learning-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
            },
          },
          {
            // Opportunities: cache for 1 hour (updated daily by scraper)
            urlPattern: /https:\/\/doogbcrodipaeahgbjuj\.supabase\.co\/rest\/v1\/scraped_content/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "opportunities-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 3600 },
            },
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 10, maxAgeSeconds: 31536000 },
            },
          },
          {
            // Static assets (images, webp)
            urlPattern: /\.(?:png|jpg|jpeg|webp|svg|ico)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "static-images",
              expiration: { maxEntries: 60, maxAgeSeconds: 2592000 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ⚠️  CRITICAL: consolidate ALL lucide icons into ONE chunk.
          // Splitting lucide-react produces 70+ tiny files that race on load → blank page.
          if (id.includes('node_modules/lucide-react')) return 'icons';

          // Core React renderer
          if (id.includes('node_modules/react-dom')) return 'react-dom';

          // Client-side routing
          if (id.includes('node_modules/react-router')) return 'router';

          // Supabase client + realtime
          if (id.includes('node_modules/@supabase')) return 'supabase';

          // TanStack Query
          if (id.includes('node_modules/@tanstack')) return 'query';

          // Radix UI primitives (shadcn/ui internals)
          if (id.includes('node_modules/@radix-ui')) return 'radix';

          // NOTE: recharts / d3-* intentionally NOT in manualChunks.
          // d3 has synchronous cross-package imports that break when split → blank page.
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
}));
