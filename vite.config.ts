import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/** Cloudflare Rocket Loader type="module" ni buzadi — SPA lazy route ErrorBoundary. */
function cloudflareNoRocketLoader() {
  return {
    name: "cloudflare-no-rocket-loader",
    transformIndexHtml(html: string) {
      return html
        .replace(
          /<script(?![^>]*data-cfasync)([^>]*type="module")/g,
          '<script data-cfasync="false"$1',
        )
        .replace(
          /<link rel="modulepreload"/g,
          '<link data-cfasync="false" rel="modulepreload"',
        );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    cloudflareNoRocketLoader(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Lucide ikonlari alohida chunk bo'lib index dan createLucideIcon import
         * qilsa circular dependency → /test-ishlash ErrorBoundary.
         * Barcha lucide bitta vendor-lucide da bo'lsin.
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("lucide-react")) return "vendor-lucide";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("/react/") ||
            id.endsWith("\\react\\index.js") ||
            id.endsWith("/react/index.js")
          ) {
            return "vendor-react";
          }
        },
      },
    },
  },
}));
