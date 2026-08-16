/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Testlar uchun ALOHIDA config — vite.config.ts ga tegmaymiz.
 * Sabab: u yerdagi build plaginlari (git chaqiruvchi buildStamp, dist tozalash,
 * lovable-tagger) test muhitida keraksiz va sekinlashtiradi.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    restoreMocks: true,
    /**
     * TESTLAR `.env` GA BOG'LIQ BO'LMASIN.
     *
     * `.env` gitignore da (to'g'ri — u maxfiy qiymatlarni saqlaydi), shuning
     * uchun CI da u YO'Q. Natijada `Pro.pendingPlan.test.tsx` faqat CI da
     * yiqilardi: `payme.ts` MERCHANT_ID ni import paytida o'qiydi, u
     * bo'lmasa `buildPaymeCheckoutUrl` null qaytaradi va yo'naltirish
     * umuman sodir bo'lmaydi ("expected +0 to be 1").
     *
     * Bu yerdagi qiymat — Payme hujjatidagi RASMIY NAMUNA kassa ID si,
     * haqiqiy kassa emas. Testlar endi mahalliy `.env` bor-yo'qligidan
     * qat'i nazar bir xil natija beradi.
     */
    env: {
      VITE_PAYME_MERCHANT_ID: "587f72c72cac0d162c722ae2",
    },
  },
});
