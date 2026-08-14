import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { execSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Savol JSON larining MAZMUNIDAN kesh belgisi hisoblaydi.
 *
 * NEGA KERAK: bu fayllar CDN da 24 soat + 7 kun `stale-while-revalidate`
 * bilan keshlanadi. Ilgari kesh belgisi `fetchQuestionJson.ts` da QO'LDA
 * yozilardi — va uni yangilash unutilsa, tuzatilgan savollar
 * foydalanuvchiga bir necha kungacha yetib bormasdi (aynan shu bir marta
 * sodir bo'lgan). Endi belgi fayllar mazmunidan chiqadi: JSON o'zgarsa
 * belgi ham o'zgaradi, o'zgarmasa — o'sha-o'sha (keraksiz qayta yuklash
 * bo'lmaydi). Foydalanuvchi buni umuman sezmaydi: hech qanday "yangilang"
 * oynasi yo'q, shunchaki URL dagi `?v=` boshqacha bo'ladi.
 */
function questionDataVersion(): string {
  const publicDir = path.resolve(__dirname, "public");
  const hash = crypto.createHash("sha256");

  const walk = (dir: string): string[] => {
    let out: string[] = [];
    for (const name of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) out = out.concat(walk(p));
      else if (name.endsWith(".json")) out.push(p);
    }
    return out;
  };

  try {
    for (const file of walk(publicDir)) {
      // Fayl nomi ham qo'shiladi: fayl qo'shilsa/o'chirilsa ham belgi o'zgarsin
      hash.update(path.relative(publicDir, file).replace(/\\/g, "/"));
      hash.update(fs.readFileSync(file));
    }
    return hash.digest("hex").slice(0, 12);
  } catch {
    // Hash olinmasa build to'xtamasin — sanaga qaytamiz (eng yomoni:
    // bir marta ortiqcha qayta yuklash, eskirgan ma'lumot emas).
    return new Date().toISOString().slice(0, 10).replace(/-/g, "");
  }
}

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

/**
 * Har bir build ga o'ziga xos belgi qo'yadi. Ilgari bu qo'lda yozilardi
 * (`dbe5957-lucide-eager`) va eskirib qolardi — natijada deploy chindan
 * yangilanganini tekshirib bo'lmasdi. Endi commit SHA + vaqt avtomatik.
 */
function buildStamp() {
  let stamp: string;
  try {
    stamp = execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    stamp = "nogit";
  }
  const full = `${stamp}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}`;
  return {
    name: "build-stamp",
    apply: "build" as const,
    transformIndexHtml(html: string) {
      return html
        .replace(/<!-- BUILD:[^>]*-->/, `<!-- BUILD: ${full} -->`)
        .replace(
          /(<meta name="x-avtotestu-build" content=")[^"]*(")/,
          `$1${full}$2`,
        );
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
    buildStamp(),
    cloudflareNoRocketLoader(),
    excludeSourceDataFromDist(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  define: {
    /**
     * Savol JSON larining mazmun-hash i. `fetchQuestionJson.ts` shuni
     * `?v=` sifatida ishlatadi — qo'lda yangilash SHART EMAS.
     */
    __QUESTION_DATA_VERSION__: JSON.stringify(questionDataVersion()),
  },
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
