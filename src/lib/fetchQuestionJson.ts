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
    msg.includes('aborted') ||
    msg.includes('timeout')
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
export const QUESTION_DATA_CACHE_BUST = "20260805a";

function withCacheBust(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${QUESTION_DATA_CACHE_BUST}`;
}

/**
 * Sekin internet uchun "stall" timeout: umumiy vaqt emas, ma'lumot kelmay
 * qolgan vaqt o'lchanadi. 2 MB ni 60 soniyada yuklayotgan sekin ulanish
 * muvaffaqiyatli tugaydi; 15 soniya davomida bitta bayt kelmasa — uziladi.
 * Ilgari umuman timeout yo'q edi va uzilgan ulanish abadiy osilib qolardi.
 */
const STALL_TIMEOUT_MS = 15_000;

/** Javob oqimini o'qiydi va har chunk da stall taymerini yangilaydi. */
async function readWithStallTimeout(
  response: Response,
  signal: { cancel: (reason: Error) => void; ping: () => void },
): Promise<string> {
  if (!response.body) {
    // Oqim yo'q (eski brauzer / test muhiti) — oddiy o'qish
    return response.text();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
      signal.ping(); // progress bor — taymerni qayta boshlash
    }
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder("utf-8").decode(merged);
}

/** 4xx — qayta urinish foydasiz (fayl yo'q / noto'g'ri so'rov) */
function isPermanentHttpError(err: Error): boolean {
  const m = /^HTTP (\d{3})$/.exec(err.message);
  if (!m) return false;
  const status = Number(m[1]);
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

export async function fetchQuestionJson(
  url: string,
  retries = 3
): Promise<unknown> {
  let lastErr: Error | null = null;
  const finalUrl = withCacheBust(url);

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    let stallTimer: ReturnType<typeof setTimeout> | null = null;
    let stalled = false;

    const ping = () => {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        stalled = true;
        controller.abort();
      }, STALL_TIMEOUT_MS);
    };

    try {
      ping();
      /**
       * `cache: "no-cache"` EMAS: URL da allaqachon `?v=` cache-bust bor, ya'ni
       * yangi ma'lumot chiqqanda URL o'zgaradi. "no-cache" esa har safar
       * to'liq revalidatsiya majbur qilib, `_headers` dagi CDN s-maxage ni
       * behuda qilardi va sekin ulanishda har kirishda qaytadan yuklardi.
       */
      const response = await fetch(finalUrl, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await readWithStallTimeout(response, {
        cancel: (e) => { lastErr = e; controller.abort(); },
        ping,
      });

      if (stallTimer) clearTimeout(stallTimer);
      await yieldToMain();
      return JSON.parse(text) as unknown;
    } catch (err) {
      if (stallTimer) clearTimeout(stallTimer);

      let e = err instanceof Error ? err : new Error(String(err));
      if (stalled || e.name === "AbortError") {
        e = new Error("timeout");
      }
      lastErr = e;

      if (isPermanentHttpError(e)) break;
      if (attempt < retries) {
        // Eksponensial backoff + jitter — tarmoq tiklanishiga vaqt beradi
        await sleep(700 * 2 ** attempt + Math.random() * 300);
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
