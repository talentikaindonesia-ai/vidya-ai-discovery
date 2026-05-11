import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
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

          // Core React renderer (large, rarely changes — good for long-term caching)
          if (id.includes('node_modules/react-dom')) return 'react-dom';

          // Client-side routing
          if (id.includes('node_modules/react-router')) return 'router';

          // Supabase client + realtime (sizeable, version-stable)
          if (id.includes('node_modules/@supabase')) return 'supabase';

          // TanStack Query
          if (id.includes('node_modules/@tanstack')) return 'query';

          // Radix UI primitives (shadcn/ui internals)
          if (id.includes('node_modules/@radix-ui')) return 'radix';
        },
      },
    },
    // Raise warning threshold — some page chunks will be < 500 kB after splitting
    chunkSizeWarningLimit: 600,
  },
}));
