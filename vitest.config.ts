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
  },
});
