/**
 * Darslik progressi — qaysi dars ko'rilgan va qayerda to'xtaganini saqlaydi.
 *
 * NEGA localStorage, SERVER EMAS:
 *   Progress — qulaylik ma'lumoti, qiymatli ma'lumot emas. U yo'qolsa
 *   foydalanuvchi hech narsa yo'qotmaydi (videolar joyida). Serverga
 *   yozish esa har bir `timeupdate` da (soniyada 4 marta) tarmoqqa
 *   so'rov degani bo'lardi yoki murakkab navbat talab qilardi.
 *   Qurilmalar orasida sinxronlash kerak bo'lsa, `read`/`write` ni
 *   almashtirish kifoya — qolgan kod tegilmaydi.
 *
 * `useSyncExternalStore` NEGA:
 *   Progressni bir vaqtda ikki joy o'qiydi — plerer (yozadi) va dars
 *   ro'yxati (belgini ko'rsatadi). Ular ota-bola emas, yonma-yon.
 *   Umumiy do'kon bo'lmasa, ro'yxat pleyer yozgan o'zgarishni ko'rmasdi.
 */
import { useCallback, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Kalit HISOB bo'yicha (audit ENG-06): ilgari bitta umumiy kalit edi — bir
 * qurilmada A va B hisoblari bilan kirilsa, progress aralashib ketardi.
 * Mehmon — `guest`. Eski umumiy kalitdagi progressni birinchi kirgan hisob
 * o'ziga oladi (yo'qolmasin); mehmon uni faqat o'qiydi.
 */
const LEGACY_KEY = "darslik:progress:v1";
const keyFor = (owner: string) => `${LEGACY_KEY}:${owner}`;

/** Shu ulushdan ko'p ko'rilgan dars "ko'rilgan" deb belgilanadi. */
const WATCHED_RATIO = 0.9;

/**
 * Oxirgi pozitsiya shundan qisqa bo'lsa saqlanmaydi.
 * Tasodifan bosilib, 2 soniyada yopilgan video "davom ettirish"
 * taklifini chiqarmasligi kerak.
 */
const MIN_RESUME_SECONDS = 15;

export interface LessonProgress {
  /** Dars oxirigacha (yoki ~90% gacha) ko'rilganmi. */
  watched: boolean;
  /** Oxirgi to'xtagan joyi, soniyada. Tugagan darsda 0. */
  position: number;
}

type ProgressMap = Record<string, LessonProgress>;

const EMPTY: ProgressMap = {};

/** Har egaga alohida kesh — `useSyncExternalStore` bir xil obyektni olishi shart. */
const cache = new Map<string, ProgressMap>();
const listeners = new Set<() => void>();

function parse(raw: string | null): ProgressMap | null {
  if (!raw) return null;
  const parsed = JSON.parse(raw) as unknown;
  return parsed && typeof parsed === "object" ? (parsed as ProgressMap) : null;
}

function read(owner: string): ProgressMap {
  const hit = cache.get(owner);
  if (hit) return hit;
  let value: ProgressMap = {};
  try {
    const own = parse(localStorage.getItem(keyFor(owner)));
    if (own) {
      value = own;
    } else {
      const legacy = parse(localStorage.getItem(LEGACY_KEY));
      if (legacy) {
        value = legacy;
        if (owner !== "guest") {
          // Eski progress shu hisobga o'tkaziladi — keyingi hisob uni olmaydi.
          localStorage.setItem(keyFor(owner), JSON.stringify(legacy));
          localStorage.removeItem(LEGACY_KEY);
        }
      }
    }
  } catch {
    // Maxfiy rejim, kvota yoki buzuq JSON — progressiz ishlayveramiz.
  }
  cache.set(owner, value);
  return value;
}

function write(owner: string, next: ProgressMap): void {
  cache.set(owner, next);
  try {
    localStorage.setItem(keyFor(owner), JSON.stringify(next));
  } catch {
    /* saqlab bo'lmadi — joriy sessiyada baribir ishlaydi */
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Server tomonida localStorage yo'q — bo'sh holat qaytadi. */
function getServerSnapshot(): ProgressMap {
  return EMPTY;
}

export function markLessonWatched(owner: string, lessonId: string): void {
  const current = read(owner);
  if (current[lessonId]?.watched) return;
  write(owner, { ...current, [lessonId]: { watched: true, position: 0 } });
}

export function saveLessonPosition(owner: string, lessonId: string, position: number, duration: number): void {
  const current = read(owner);
  const existing = current[lessonId];

  // Oxirigacha ko'rilgan bo'lsa — "ko'rildi", pozitsiya kerak emas.
  if (duration > 0 && position / duration >= WATCHED_RATIO) {
    if (existing?.watched) return;
    write(owner, { ...current, [lessonId]: { watched: true, position: 0 } });
    return;
  }

  if (position < MIN_RESUME_SECONDS) return;

  // Har soniyada emas, har 5 soniyada yozamiz — `timeupdate` juda tez-tez
  // ishlaydi va har safar JSON.stringify qilish behuda yuk bo'lardi.
  const rounded = Math.floor(position / 5) * 5;
  if (existing && existing.position === rounded) return;

  write(owner, { ...current, [lessonId]: { watched: existing?.watched ?? false, position: rounded } });
}

export function resetDarslikProgress(owner: string): void {
  write(owner, {});
}

/** Faqat testlar uchun: modul keshini tozalaydi. */
export function __resetDarslikCacheForTests(): void {
  cache.clear();
}

export interface ModuleStats {
  total: number;
  watched: number;
  /** 0..1 */
  ratio: number;
  done: boolean;
  started: boolean;
}

export function statsFor(progress: ProgressMap, lessonIds: readonly string[]): ModuleStats {
  const total = lessonIds.length;
  let watched = 0;
  let started = false;
  for (const id of lessonIds) {
    const entry = progress[id];
    if (!entry) continue;
    if (entry.watched) watched += 1;
    if (entry.watched || entry.position > 0) started = true;
  }
  return {
    total,
    watched,
    ratio: total === 0 ? 0 : watched / total,
    done: total > 0 && watched === total,
    started,
  };
}

/** Progressni o'qish va yozish uchun yagona kirish nuqtasi (joriy hisob bo'yicha). */
export function useDarslikProgress() {
  const { user } = useAuth();
  const owner = user?.id ?? "guest";
  const getSnapshot = useCallback(() => read(owner), [owner]);
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const markWatched = useCallback((lessonId: string) => markLessonWatched(owner, lessonId), [owner]);
  const savePosition = useCallback(
    (lessonId: string, position: number, duration: number) =>
      saveLessonPosition(owner, lessonId, position, duration),
    [owner],
  );

  return { progress, markWatched, savePosition };
}
