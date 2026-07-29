import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * public/ dagi ba'zi fayllar — savol QA tooling uchun manba ma'lumot,
 * brauzerga uzatiladigan asset emas. Vite public/ ni butunlay dist/ ga
 * nusxalagani uchun ularni build oxirida olib tashlaymiz.
 *
 * 600.json + barcha.json — har biri ~5.9 MB, bir xil 1250 ta savol
 * (600.json nomi yolg'on: ichida 600 emas, 1250 ta savol bor). Brauzer
 * faqat til bo'yicha ajratilgan barcha-uz-lat/uz-cyr/ru.json ni yuklaydi.
 * `npm run questions:*` skriptlari bu ikkisini disk da o'qiydi — shuning
 * uchun o'chirilmaydi, faqat deploy ga chiqmaydi (-11.7 MB).
 */
const DIST_EXCLUDE = ["600.json", "barcha.json"];

function excludeSourceDataFromDist() {
  return {
    name: "exclude-source-data-from-dist",
    apply: "build" as const,
    closeBundle() {
      for (const name of DIST_EXCLUDE) {
        const target = path.resolve(__dirname, "dist", name);
        try {
          if (fs.existsSync(target)) {
            fs.unlinkSync(target);
            console.log(`[dist] excluded source-data file: ${name}`);
          }
        } catch (err) {
          console.warn(`[dist] could not exclude ${name}:`, err);
        }
      }
    },
  };
}

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
    excludeSourceDataFromDist(),
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
