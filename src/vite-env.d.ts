/// <reference types="vite/client" />

declare global {
  /**
   * Savol JSON larining mazmun-hash i. Build paytida vite.config.ts dagi
   * `define` orqali beriladi (qo'lda yangilanmaydi).
   */
  const __QUESTION_DATA_VERSION__: string;

  interface Window {
    /**
     * `index.html` dagi ishga tushish tiklanishi faolmi.
     *
     * U yerda `true` qilinadi, `main.tsx` ilova yuklangach `false` qiladi —
     * shundan keyin lazy chunk xatolarini `lazyWithRetry` boshqaradi.
     */
    __bootRecoveryArmed?: boolean;
  }
}

export {};
