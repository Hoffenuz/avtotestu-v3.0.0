/**
 * Qurilma soati noto'g'ri bo'lganda sessiya yangilanishining cheksiz
 * tsiklini oldini oluvchi `fetch` o'rami.
 *
 * MUAMMO: Supabase Auth token javobida `expires_at` ni SERVER soati bilan
 * (mutlaq Unix vaqt) qaytaradi, supabase-js esa uni QURILMA soati bilan
 * solishtiradi (`expires_at * 1000 - Date.now() < 90 s` → "eskirgan").
 * Qurilma soati ~1 soat oldinda bo'lsa (O'zbekistonda Windows'da noto'g'ri
 * vaqt zonasi ko'p uchraydi), yangi olingan token ham darhol "eskirgan"
 * ko'rinadi → har bir so'rovdan oldin yana refresh → daqiqasiga 30–60 ta
 * refresh → Supabase 429 (limit) → sessiya yo'qoladi va so'rovlar anon
 * bo'lib ketadi (2026-10-10: shu sabab bir foydalanuvchi Click to'lovini
 * 4 marta boshlay olmagan — `click_create_order` 401).
 *
 * YECHIM: Auth javobida `expires_in` (nisbiy, soniyada) ham bor. supabase-js
 * `expires_at` bo'lmasa uni o'zi `Date.now() + expires_in` deb hisoblaydi —
 * bu qurilma soatiga nisbatan to'g'ri. Shuning uchun `expires_at` ni qurilma
 * soati bo'yicha qayta hisoblaymiz. Soat to'g'ri bo'lgan qurilmada farq faqat
 * tarmoq kechikishi (bir necha soniya) — xatti-harakat o'zgarmaydi.
 */

const AUTH_PATH = '/auth/v1/';

type TokenBody = { access_token?: unknown; expires_in?: unknown; expires_at?: unknown };

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

export function withLocalExpiry<T extends TokenBody>(body: T, nowMs: number = Date.now()): T {
  if (
    typeof body?.access_token !== 'string' ||
    typeof body.expires_in !== 'number' ||
    !Number.isFinite(body.expires_in)
  ) {
    return body;
  }
  return { ...body, expires_at: Math.round(nowMs / 1000) + body.expires_in };
}

/**
 * PostgREST "token muddati o'tgan" javobi (401, PGRST303 / eski PGRST301).
 *
 * NEGA KERAK: qurilma soati ORQADA bo'lsa (CMOS batareya o'tirgan, sana
 * qo'lda o'zgartirilgan), supabase-js muddati o'tgan tokenni hali amal
 * qiladi deb hisoblaydi va uni YANGILAMAYDI — server esa har so'rovni 401
 * bilan rad etadi. Foydalanuvchi uchun bu "sayt ishlamayapti": profil, PRO
 * holati, natijalar — hammasi yo'qoladi (2026-10-12: bitta foydalanuvchi 4
 * soat shu holatda qoldi; 2026-10-11 da boshqasi 3 kunlik token yuborgan).
 * Yuqoridagi `expires_at` tuzatishi faqat YANGI olingan tokenga ta'sir
 * qiladi — qurilmada saqlanib qolgan eski sessiya baribir qotib qolardi.
 * Server javobi soatga bog'liq emas, shuning uchun unga tayanamiz.
 */
async function isJwtExpiredResponse(res: Response): Promise<boolean> {
  if (res.status !== 401) return false;
  try {
    const body = (await res.clone().json()) as { code?: unknown; message?: unknown };
    return (
      body?.code === 'PGRST303' ||
      body?.code === 'PGRST301' ||
      (typeof body?.message === 'string' && /jwt expired/i.test(body.message))
    );
  } catch {
    return false;
  }
}

export function createClockSkewSafeFetch(
  baseFetch: typeof fetch = (input, init) => fetch(input, init),
  options: { onJwtExpired?: () => void } = {},
): typeof fetch {
  return async (input, init) => {
    const res = await baseFetch(input, init);
    const isAuth = requestUrl(input).includes(AUTH_PATH);
    if (!isAuth && options.onJwtExpired && (await isJwtExpiredResponse(res))) {
      options.onJwtExpired();
      return res;
    }
    if (!res.ok || !isAuth) return res;
    if (!(res.headers.get('content-type') ?? '').includes('application/json')) return res;

    let body: TokenBody;
    try {
      body = await res.clone().json();
    } catch {
      return res;
    }
    const fixed = withLocalExpiry(body);
    if (fixed === body) return res;

    const headers = new Headers(res.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    return new Response(JSON.stringify(fixed), {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  };
}
