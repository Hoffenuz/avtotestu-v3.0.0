import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // `tools/live-test` — lokal Playwright vositasi, repozitoriyga kirmaydi
  // va boshqa muhitda ishlaydi; loyiha qoidalari unga tegishli emas.
  { ignores: ["dist", "tools/live-test"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // Supabase Edge Functions — Deno muhiti, brauzer emas.
    //
    // `no-explicit-any` bu yerda o'chirilgan: Telegram webhook yuklamasi va
    // RPC natijalari tashqaridan keladigan, sxemasi oldindan ma'lum
    // bo'lmagan JSON. Ularni `unknown` deb belgilash har bir maydonga
    // qo'lda tekshiruv qo'shishni talab qiladi va kodni aniqroq qilmaydi —
    // haqiqiy tekshiruv baribir ish paytida bo'ladi.
    files: ["supabase/functions/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node, Deno: "readonly" },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
