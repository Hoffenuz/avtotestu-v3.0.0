/**
 * Cloudflare Pages Functions — Global Edge Middleware
 *
 * Muammo: CF Pages statik fayllarni (_redirects qoidalaridan OLDIN) yuboradi.
 * Shuning uchun public/test-ishlash/index.html mavjud bo'lsa, hamma —
 * bot ham, oddiy user ham — o'sha statik faylni oladi.
 *
 * Yechim (Dynamic Rendering at Edge):
 *   Bot/crawler  → next() → CF Pages statik HTML yuboradi  → SEO uchun ideal
 *   Oddiy user   → next('/index.html') → React SPA yuboradi → app to'g'ri ishlaydi
 *   Asset (.js,.css,.webp,...) → next() → CF Pages fayl yuboradi
 */

// ---------------------------------------------------------------------------
// Bot pattern — keng ro'yxat: Google, Bing, Yandex, social, SEO toollar
// ---------------------------------------------------------------------------
const BOT_UA =
  /googlebot|adsbot-google|google-inspectiontool|bingbot|msnbot|yandexbot|yandex|baiduspider|duckduckbot|slurp|teoma|ia_archiver|archive\.org_bot|facebookexternalhit|facebot|meta-externalagent|twitterbot|telegrambot|slackbot|linkedinbot|whatsapp|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|360spider|sogou|exabot|netcraft|gptbot|oai-searchbot|claudebot|cohere-ai|anthropic-ai|perplexitybot|youbot|diffbot/i;

// ---------------------------------------------------------------------------
// SPA route prefikslari — React Router boshqaradigan yo'llar
// ---------------------------------------------------------------------------
const SPA_PREFIXES: string[] = [
  '/test-ishlash',
  '/belgilar',
  '/variant',
  '/mavzuli',
  '/darslik',
  '/qoshimcha',
  '/pro',
  '/contact',
  '/yangiliklar',
  '/savol',
  '/profile',
  '/auth',
  '/desktop',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fayl kengaytmasi bor yo'l → statik asset (JS, CSS, rasm, font, JSON...) */
function isStaticAsset(pathname: string): boolean {
  return /\.\w{1,8}$/.test(pathname);
}

/** Berilgan yo'l SPA route'iga tegishlimi */
function isSpaRoute(pathname: string): boolean {
  const clean =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;
  if (clean === '' || clean === '/') return true;
  return SPA_PREFIXES.some(
    (p) => clean === p || clean.startsWith(p + '/'),
  );
}

// ---------------------------------------------------------------------------
// Types (without needing @cloudflare/workers-types package)
// ---------------------------------------------------------------------------
interface PagesContext {
  request: Request;
  /** next() → davomiy handler (statik fayl yoki keyingi middleware) */
  next: (input?: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  env: Record<string, unknown>;
  params: Record<string, string | string[]>;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Middleware entry point
// ---------------------------------------------------------------------------
export async function onRequest(ctx: PagesContext): Promise<Response> {
  const { request, next } = ctx;
  const url = new URL(request.url);
  const path = url.pathname;

  // ── 1. Statik assetlar: to'g'ridan-to'g'ri o'tkazib yubor ────────────────
  //    (JS, CSS, webp, json, woff2, ico, pdf, ...)
  if (isStaticAsset(path)) {
    return next();
  }

  // ── 2. /index.html ning o'zi: next() bilan xizmat qil ──────────────────
  //    (ichki fetch() dan kelgan so'rovlar uchun cheksiz loop oldini olish)
  if (path === '/index.html') {
    return next();
  }

  const ua = request.headers.get('user-agent') ?? '';
  const isBot = BOT_UA.test(ua);

  // ── 3. Botlar / crawlerlar ──────────────────────────────────────────────
  //    next() → CF Pages statik HTML faylini topib beradi (agar mavjud bo'lsa).
  //    Mavjud bo'lmasa → _redirects qoidalari ishga tushadi.
  //    Vary: User-Agent qo'shiladi — CF edge bot uchun alohida kesh saqlashi uchun.
  if (isBot) {
    const res = await next();
    const headers = new Headers(res.headers);
    headers.set('Vary', 'User-Agent');
    return new Response(res.body, { status: res.status, headers });
  }

  // ── 4. Oddiy foydalanuvchilar (SPA route'lari) ─────────────────────────
  //    URL o'zgarmasdan (redirect yo'q), lekin React SPA yetkaziladi.
  //    React Router client-side routing bilan to'g'ri route'ni render qiladi.
  if (isSpaRoute(path)) {
    // CF Pages next() ga yangi URL bilan so'rov yuboramiz — statik /index.html
    // URL brauzerda o'zgarmaydi, faqat xizmat qilinadigan kontent o'zgaradi.
    const spaRequest = new Request(
      new URL('/index.html', url.origin).toString(),
      {
        method: request.method,
        headers: request.headers,
      },
    );
    const res = await next(spaRequest);
    const headers = new Headers(res.headers);
    // Brauzer ham, CF edge ham keshlamasin — har so'rovda yangi SPA beriladi
    headers.set('Content-Type', 'text/html; charset=utf-8');
    headers.set('Cache-Control', 'no-store');
    // s-maxage ni olib tashlaymiz (agar _headers dan kelgan bo'lsa)
    return new Response(res.body, { status: res.status, headers });
  }

  // ── 5. Boshqa barcha so'rovlar (404, /favicon.ico, ...) ───────────────
  return next();
}
