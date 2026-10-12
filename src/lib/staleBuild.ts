/**
 * Eski build bilan ishlab turgan tablarni yangilash.
 *
 * MUAMMO: index.html `no-cache`, ya'ni YANGI kirishda doim yangi kod keladi.
 * Lekin ochiq qolgan tab (ayniqsa noutbuk uyqudan uyg'onganda yoki telefon
 * fonidan qaytganda) sahifani qayta yuklamaydi va kunlab ESKI JS bilan
 * ishlaydi — tuzatilgan xatolar (masalan sessiya yangilash tsikli) unda
 * davom etadi. 2026-10-12: tuzatish chiqqandan keyin ham bitta tab 2
 * daqiqada 47 marta refresh qilgan — u eski kod bilan ochiq qolgan edi.
 *
 * YECHIM: tab ko'rinadigan bo'lganda (va soatda bir marta) `/` ni keshsiz
 * so'rab, undagi asosiy skript nomi (`/assets/index-<hash>.js`) joriy
 * sahifadagi bilan solishtiriladi. Farq bo'lsa — yangi deploy bor.
 * Qayta yuklash faqat XAVFSIZ sahifada (test/imtihon o'rtasida emas);
 * test sahifasida bo'lsa keyingi sahifaga o'tishda yuklanadi.
 */

const ENTRY_RE = /\/assets\/index-[A-Za-z0-9_-]+\.js/;

/** Shu sahifa yuklangan build ning asosiy skripti (dev rejimda null). */
export function currentEntry(doc: Document = document): string | null {
  const scripts = Array.from(doc.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'));
  for (const s of scripts) {
    const m = s.getAttribute('src')?.match(ENTRY_RE);
    if (m) return m[0];
  }
  return null;
}

export function entryFromHtml(html: string): string | null {
  return html.match(ENTRY_RE)?.[0] ?? null;
}

/**
 * Qayta yuklash xavfsiz sahifalar. Ro'yxatda YO'Q sahifa (variant, mavzuli,
 * real imtihon, xatolar testi va h.k.) — test davom etayotgan bo'lishi
 * mumkin, u yerda sahifa o'z-o'zidan yangilanmaydi.
 */
const SAFE_EXACT = new Set([
  '/', '/test-ishlash', '/belgilar', '/contact', '/darslik', '/qoshimcha', '/yangiliklar',
  '/bolimlar', '/xatolarim', '/saqlangan', '/pro', '/profile', '/prava-olish',
  '/avtoimtihon-2026', '/e-avtomaktab', '/yodlash-kerak', '/desktop',
]);
const SAFE_PREFIX = ['/belgilar/', '/darslik/', '/yangiliklar/', '/yodlash-kerak/', '/savol/'];

export function isSafeToReload(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return SAFE_EXACT.has(p) || SAFE_PREFIX.some((x) => p.startsWith(x));
}

const RELOADED_KEY = 'stale-build-reloaded';
const RELOAD_GUARD_MS = 10 * 60_000;

/**
 * Bir xil yangi build uchun 10 daqiqada bir martadan ko'p reload qilmaymiz —
 * CDN eski HTML bersa ham cheksiz reload sikli bo'lmasin.
 */
export function shouldReloadFor(target: string, now: number = Date.now()): boolean {
  try {
    const raw = localStorage.getItem(RELOADED_KEY);
    if (raw) {
      const prev = JSON.parse(raw) as { target?: string; at?: number };
      if (prev.target === target && typeof prev.at === 'number' && Math.abs(now - prev.at) < RELOAD_GUARD_MS) {
        return false;
      }
    }
    localStorage.setItem(RELOADED_KEY, JSON.stringify({ target, at: now }));
    return true;
  } catch {
    // Storage yo'q (private rejim) — himoyasiz reload xavfli, voz kechamiz.
    return false;
  }
}

/** Serverdagi eng yangi build skripti (xato bo'lsa null — hech narsa qilinmaydi). */
export async function fetchLatestEntry(fetchImpl: typeof fetch = fetch): Promise<string | null> {
  try {
    const res = await fetchImpl('/', { cache: 'no-store', credentials: 'same-origin' });
    if (!res.ok) return null;
    return entryFromHtml(await res.text());
  } catch {
    return null;
  }
}
