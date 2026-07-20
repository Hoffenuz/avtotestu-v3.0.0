/**
 * Fetch full question JSON with retries and non-blocking parse (keeps loading UI responsive).
 */

export type FetchErrorTranslator = (key: string) => string;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Browser/network errors → user-facing message (avoid raw "Failed to fetch"). */
export function getFetchErrorMessage(
  err: unknown,
  t?: FetchErrorTranslator
): string {
  const fallback = t?.('test.errorLoadingData') ?? 'Ma\'lumotlarni yuklashda xatolik';
  const networkMsg = t?.('test.networkError') ?? fallback;

  if (!(err instanceof Error)) return fallback;

  const msg = err.message.toLowerCase();
  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('aborted')
  ) {
    return networkMsg;
  }
  if (msg.startsWith('http ')) {
    return t?.('test.fileNotFound') ?? fallback;
  }
  return err.message || fallback;
}

/** Let the browser paint loading state before heavy JSON.parse */
const yieldToMain = () =>
  new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });

export function normalizeQuestionArray(jsonData: unknown): unknown[] {
  if (!jsonData || typeof jsonData !== 'object') return [];
  const d = jsonData as Record<string, unknown>;
  if (Array.isArray(jsonData)) return jsonData;
  if (Array.isArray(d.data)) return d.data as unknown[];
  if (Array.isArray(d.questions)) return d.questions as unknown[];
  return [];
}

/** Bump when question JSON structure/langs change — busts long CDN/browser caches */
export const QUESTION_DATA_CACHE_BUST = "20260720b";

function withCacheBust(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${QUESTION_DATA_CACHE_BUST}`;
}

export async function fetchQuestionJson(
  url: string,
  retries = 3
): Promise<unknown> {
  let lastErr: Error | null = null;
  const finalUrl = withCacheBust(url);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // no-cache: avoid stale variant JSON (e.g. early v63 Latin-only) after lang updates
      const response = await fetch(finalUrl, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      await yieldToMain();
      return JSON.parse(text) as unknown;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await sleep(700 * (attempt + 1));
      }
    }
  }

  throw lastErr ?? new Error('Fetch failed');
}

/** Fisher–Yates shuffle */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function selectQuestionsFromPool<T>(
  pool: readonly T[],
  count: number,
  randomize: boolean
): T[] {
  if (pool.length === 0) return [];
  if (!randomize) return pool.slice(0, count);
  return shuffleArray(pool).slice(0, Math.min(count, pool.length));
}
