/**
 * Cloudflare Pages Functions — Global Edge Middleware
 *
 * Muammo: CF Pages statik fayllarni (_redirects qoidalaridan OLDIN) yuboradi.
 * Agar public/mavzuli/index.html bo'lsa, hamma (bot + user) o'sha faylni oladi —
 * React SPA o'rniga eski SEO HTML ochiladi (refreshda "xatolik"/noto'g'ri UI).
 *
 * Yechim:
 *   Bot/crawler  → /_seo/{route}/index.html (SEO snapshot)
 *   Oddiy user   → /index.html (React SPA); URL brauzerda o'zgarmaydi
 *   Asset (.js,.css,...) → next()
 */

const BOT_UA =
  /googlebot|adsbot-google|google-inspectiontool|bingbot|msnbot|yandexbot|yandex|baiduspider|duckduckbot|slurp|teoma|ia_archiver|archive\.org_bot|facebookexternalhit|facebot|meta-externalagent|twitterbot|telegrambot|slackbot|linkedinbot|whatsapp|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|360spider|sogou|exabot|netcraft|gptbot|oai-searchbot|claudebot|cohere-ai|anthropic-ai|perplexitybot|youbot|diffbot/i;

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

/** SEO snapshot bor asosiy route'lar (public/_seo/{route}/index.html) */
const SEO_ROUTE_PREFIXES: string[] = [
  '/test-ishlash',
  '/belgilar',
  '/variant',
  '/mavzuli',
  '/darslik',
  '/qoshimcha',
  '/pro',
  '/contact',
  '/desktop',
];

function isStaticAsset(pathname: string): boolean {
  return /\.\w{1,8}$/.test(pathname);
}

function cleanPath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

function isSpaRoute(pathname: string): boolean {
  const clean = cleanPath(pathname);
  if (clean === '' || clean === '/') return true;
  return SPA_PREFIXES.some((p) => clean === p || clean.startsWith(p + '/'));
}

/** Bot uchun SEO snapshot yo'li — faqat aniq asosiy sahifalar */
function seoSnapshotPath(pathname: string): string | null {
  const clean = cleanPath(pathname);
  for (const p of SEO_ROUTE_PREFIXES) {
    if (clean === p) return `/_seo${p}/index.html`;
  }
  return null;
}

interface PagesFetcher {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

interface PagesContext {
  request: Request;
  next: (input?: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  env: { ASSETS?: PagesFetcher } & Record<string, unknown>;
  params: Record<string, string | string[]>;
  data: Record<string, unknown>;
}

/** URL o'zgartirib asset olish — next(Request) ba'zan original pathni saqlab qoladi */
async function fetchPath(
  ctx: PagesContext,
  absolutePath: string,
): Promise<Response> {
  const url = new URL(absolutePath, ctx.request.url);
  const rewritten = new Request(url.toString(), {
    method: 'GET',
    headers: ctx.request.headers,
    redirect: 'manual',
  });

  if (ctx.env.ASSETS?.fetch) {
    return ctx.env.ASSETS.fetch(rewritten);
  }
  // Fallback: string path (CF Pages next rewrite)
  return ctx.next(absolutePath);
}

function withHtmlHeaders(res: Response, extra?: Record<string, string>): Response {
  const headers = new Headers(res.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  if (extra) {
    for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  }
  return new Response(res.body, { status: res.status, headers });
}

export async function onRequest(ctx: PagesContext): Promise<Response> {
  const { request, next } = ctx;
  const url = new URL(request.url);
  const path = url.pathname;

  if (isStaticAsset(path)) {
    return next();
  }

  if (path === '/index.html' || path.startsWith('/_seo/')) {
    return next();
  }

  const ua = request.headers.get('user-agent') ?? '';
  const isBot = BOT_UA.test(ua);

  // Botlar: SEO snapshot (agar bor) — aks holda oddiy static / SPA fallback
  if (isBot) {
    const seo = seoSnapshotPath(path);
    if (seo) {
      const res = await fetchPath(ctx, seo);
      if (res.ok) {
        return withHtmlHeaders(res, { Vary: 'User-Agent' });
      }
    }
    const res = await next();
    return withHtmlHeaders(res, { Vary: 'User-Agent' });
  }

  // Oddiy foydalanuvchi: SPA route → har doim React index.html
  if (isSpaRoute(path)) {
    const res = await fetchPath(ctx, '/index.html');
    return withHtmlHeaders(res, {
      'Cache-Control': 'no-store',
      Vary: 'User-Agent',
    });
  }

  return next();
}
