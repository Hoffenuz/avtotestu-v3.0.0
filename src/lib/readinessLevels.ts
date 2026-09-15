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
 * Daraja rangi. Ataylab "yaxshi/yomon" emas, PROGRESS ranglari:
 * quyi darajalar ham xunuk ko'rinmasligi kerak — foydalanuvchi endi
 * boshlagan bo'lishi mumkin.
 */
export function levelTone(index: number) {
  switch (index) {
    case 6: return { ring: "#a855f7", text: "text-purple-600 dark:text-purple-400", chip: "border-purple-500/25 bg-purple-500/10 text-purple-700 dark:text-purple-300", bar: "bg-purple-500" };
    case 5: return { ring: "#10b981", text: "text-emerald-600 dark:text-emerald-400", chip: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-500" };
    case 4: return { ring: "#22c55e", text: "text-green-600 dark:text-green-400",   chip: "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300",     bar: "bg-green-500" };
    case 3: return { ring: "#3b82f6", text: "text-blue-600 dark:text-blue-400",     chip: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",         bar: "bg-blue-500" };
    case 2: return { ring: "#f59e0b", text: "text-amber-600 dark:text-amber-400",   chip: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",     bar: "bg-amber-500" };
    default: return { ring: "#94a3b8", text: "text-slate-600 dark:text-slate-400",  chip: "border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-300",     bar: "bg-slate-400" };
  }
}
