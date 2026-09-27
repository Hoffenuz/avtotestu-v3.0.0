/**
 * Bosh sahifadagi "Sinab ko'ring" kartasi — KIMGA, QAYSI savollar va
 * QACHON chiqadi. Holat faqat shu qurilmada (`localStorage`).
 *
 * Egasining qoidasi (2026-09-27):
 *   * Mehmon — doimiy 5 ta savol (bosh bundle ichida, tarmoq so'rovisiz).
 *     5 tasini yechib bo'lgach karta unga QAYTIB CHIQMAYDI: bir xil
 *     savollarni qayta-qayta ko'rsatish noqulay.
 *   * Kirgan foydalanuvchi — har kuni hovuzdan BOSHQA 5 ta savol
 *     (`homeSamplePool.ts`, alohida chunk). Yechib bo'lgach o'sha kun
 *     chiqmaydi, ertasi kuni keyingi to'plam.
 *
 * O'rtada to'xtagan odam keyingi safar KEYINGI savoldan davom etadi —
 * yechgan savoli yana ko'rsatilmaydi. Shu sababli holat "tugadimi" emas,
 * "nechta yechildi" ko'rinishida saqlanadi.
 *
 * Holat foydalanuvchi bo'yicha (`id`): bitta qurilmada ikki akkaunt bo'lsa,
 * biri yechgani ikkinchisiga ta'sir qilmaydi. Sana — mahalliy vaqt
 * (Toshkent yarim tuni, UTC emas).
 */

/** Bir to'plamdagi savollar soni. */
export const SAMPLE_SET_SIZE = 5;

const GUEST_SET = "guest";

export interface SampleProgress {
  /** Nechta savolga javob berilgan (keyingi savol indeksi). */
  next: number;
  /** Shulardan nechtasi to'g'ri. */
  score: number;
}

const EMPTY: SampleProgress = { next: 0, score: 0 };

/** Mahalliy sana `YYYY-MM-DD` ko'rinishida. */
export function localDay(date: Date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function sampleProgressKey(userId: string | null | undefined): string {
  return `home-sample:${userId || GUEST_SET}`;
}

/** Joriy to'plam: mehmon uchun doimiy, kirgan uchun — bugungi sana. */
function currentSet(userId: string | null | undefined, today: string): string {
  return userId ? today : GUEST_SET;
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : min;
  return Math.min(max, Math.max(min, n));
}

/** Joriy to'plam bo'yicha yutuq. Boshqa kun yoki buzilgan qiymat — boshidan. */
export function readProgress(userId: string | null | undefined, today: string = localDay()): SampleProgress {
  try {
    const raw = localStorage.getItem(sampleProgressKey(userId));
    if (!raw) return EMPTY;
    const saved = JSON.parse(raw) as { set?: unknown; next?: unknown; score?: unknown } | null;
    if (!saved || saved.set !== currentSet(userId, today)) return EMPTY;
    const next = clampInt(saved.next, 0, SAMPLE_SET_SIZE);
    return { next, score: clampInt(saved.score, 0, next) };
  } catch {
    return EMPTY;
  }
}

/** Javob berilgan zahoti chaqiriladi — sahifa yopilsa ham yutuq yo'qolmaydi. */
export function saveProgress(
  userId: string | null | undefined,
  progress: SampleProgress,
  today: string = localDay(),
): void {
  try {
    localStorage.setItem(
      sampleProgressKey(userId),
      JSON.stringify({ set: currentSet(userId, today), next: progress.next, score: progress.score }),
    );
  } catch {
    /* private rejim — faqat shu sahifada eslanadi */
  }
}

/** Joriy to'plamdagi hamma savol yechilganmi (karta chiqmaydi). */
export function isSampleDone(userId: string | null | undefined, today: string = localDay()): boolean {
  return readProgress(userId, today).next >= SAMPLE_SET_SIZE;
}

/**
 * Bugungi to'plam: hovuz 5 talik to'plamlarga bo'lingan, kunlar bo'yicha
 * navbat bilan aylanadi (60 savol — 12 kun, keyin boshidan).
 */
export function dailySet<T>(pool: readonly T[], today: string = localDay()): T[] {
  const sets = Math.floor(pool.length / SAMPLE_SET_SIZE);
  if (sets <= 1) return pool.slice(0, SAMPLE_SET_SIZE);
  const [y, m, d] = today.split("-").map(Number);
  const dayNo = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  const i = ((dayNo % sets) + sets) % sets;
  return pool.slice(i * SAMPLE_SET_SIZE, (i + 1) * SAMPLE_SET_SIZE);
}
