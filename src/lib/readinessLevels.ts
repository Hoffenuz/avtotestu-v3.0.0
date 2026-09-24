/**
 * Tayyorgarlik darajalari.
 *
 * Chegaralar BAZADAGI `get_user_readiness()` funksiyasi bilan bir xil bo'lishi
 * SHART (u yerda `v_levels = array[0, 30, 50, 70, 85, 95]`). Ikkalasi ajralib
 * ketmasligi uchun o'zgartirish har doim ikkala joyda birga qilinadi.
 */
export interface ReadinessLevel {
  /** 1 dan boshlanadi — bazadagi `level_index` bilan bir xil. */
  index: number;
  /** Shu darajaga kirish uchun kerakli eng kam foiz. */
  minPercent: number;
  /** Shu darajaning eng yuqori foizi (oxirgi darajada 100). */
  maxPercent: number;
  /** Tarjima kaliti: `readiness.level1` ... */
  labelKey: string;
}

export const READINESS_LEVELS: readonly ReadinessLevel[] = [
  { index: 1, minPercent: 0,  maxPercent: 29,  labelKey: "readiness.level1" },
  { index: 2, minPercent: 30, maxPercent: 49,  labelKey: "readiness.level2" },
  { index: 3, minPercent: 50, maxPercent: 69,  labelKey: "readiness.level3" },
  { index: 4, minPercent: 70, maxPercent: 84,  labelKey: "readiness.level4" },
  { index: 5, minPercent: 85, maxPercent: 94,  labelKey: "readiness.level5" },
  { index: 6, minPercent: 95, maxPercent: 100, labelKey: "readiness.level6" },
] as const;

/** Foizga qarab daraja (baza bilan bir xil natija beradi). */
export function levelOf(percent: number): ReadinessLevel {
  let found = READINESS_LEVELS[0];
  for (const lvl of READINESS_LEVELS) {
    if (percent >= lvl.minPercent) found = lvl;
  }
  return found;
}

/**
 * Rang FOIZGA qarab tanlanadi (darajaga emas).
 *
 * Nega: rang — bu "qanday ketyapti" degan tezkor signal, va u foiz bilan
 * bevosita bog'langanda o'qish oson bo'ladi (qizil -> sariq -> yashil).
 * Darajaga bog'langanda rang har darajada o'zgarib, ma'nosini yo'qotardi.
 */
export function toneOf(percent: number) {
  if (percent >= 85) {
    return { ring: "#10b981", text: "text-emerald-600 dark:text-emerald-400", chip: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-500" };
  }
  if (percent >= 65) {
    return { ring: "#22c55e", text: "text-green-600 dark:text-green-400", chip: "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300", bar: "bg-green-500" };
  }
  if (percent >= 40) {
    return { ring: "#f59e0b", text: "text-amber-600 dark:text-amber-400", chip: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300", bar: "bg-amber-500" };
  }
  return { ring: "#ef4444", text: "text-red-600 dark:text-red-400", chip: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300", bar: "bg-red-500" };
}
