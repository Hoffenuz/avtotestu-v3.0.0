/**
 * Cloudflare Pages Functions — Global Edge Middleware
 *
 * Qoida:
 *   Bot/crawler  → /_seo/{path}/ (SEO snapshot)
 *   Oddiy user   → SPA shell (/* → /index.html 200 rewrite)
 *   Asset (.js,.css,...) → next()
 *
 * MUHIM (redirect loop oldini olish):
 *   - Brauzerga hech qachon 3xx uzatilmasin
 *   - /index.html ga ichki fetch qilmang: CF Pages 308 → / qiladi
 *   - SEO uchun /_seo/.../index.html emas, /_seo/.../ ishlating
 */

const BOT_UA =
  /googlebot|adsbot-google|google-inspectiontool|bingbot|msnbot|yandexbot|baiduspider|duckduckbot|slurp|teoma|ia_archiver|archive\.org_bot|facebookexternalhit|facebot|meta-externalagent|twitterbot|telegrambot|slackbot|linkedinbot|whatsapp|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|360spider|sogou|exabot|netcraft|gptbot|oai-searchbot|claudebot|cohere-ai|anthropic-ai|perplexitybot|youbot|diffbot/i;

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

const SEO_EXACT: string[] = [
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

/**
 * SPA URL (/mavzuli va hokazo) uchun HECH QACHON public/s-maxage qo'ymang.
 * Aks holda CF bot SEO HTML ni /mavzuli kaliti ostida keshlaydi va
 * oddiy userga ham shu HTML ni beradi (React o'rniga statik SEO — HIT).
 * Edge kesh faqat /_seo/* da (_headers + Cache Rule 2).
 */
const SPA_NO_STORE = 'private, no-store';

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

/** Bot SEO yo'li — trailing slash (CF /index.html → / 308 beradi) */
function seoSnapshotPath(pathname: string): string | null {
  const clean = cleanPath(pathname);
  if (SEO_EXACT.includes(clean)) {
    return `/_seo${clean}/`;
  }
  if (clean.startsWith('/savol/')) {
    return `/_seo${clean}/`;
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

async function fetchAsset(
  ctx: PagesContext,
  absolutePath: string,
): Promise<Response> {
  const url = new URL(absolutePath, ctx.request.url);
  const rewritten = new Request(url.toString(), {
    method: 'GET',
    headers: ctx.request.headers,
    redirect: 'follow',
  });

  if (ctx.env.ASSETS?.fetch) {
    return ctx.env.ASSETS.fetch(rewritten);
  }
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

/**
 * SPA shell: _redirects /* → /index.html 200.
 * Ichki /index.html fetch qilinmaydi (308 loop sababi).
 */
async function serveSpaShell(ctx: PagesContext): Promise<Response> {
  const res = await ctx.next();

  if (res.status >= 300 && res.status < 400) {
    // Fallback: faqat ASSETS + follow (brauzerga 308 ketmasin)
    const viaAssets = await fetchAsset(ctx, '/');
    if (viaAssets.ok) {
      return withHtmlHeaders(viaAssets, {
        'Cache-Control': SPA_NO_STORE,
        'CDN-Cache-Control': 'no-store',
        Vary: 'User-Agent',
      });
    }
    return new Response('Sahifa yuklanmadi.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': SPA_NO_STORE,
        'CDN-Cache-Control': 'no-store',
      },
    });
  }

  return withHtmlHeaders(res, {
    'Cache-Control': SPA_NO_STORE,
    'CDN-Cache-Control': 'no-store',
    Vary: 'User-Agent',
  });
}

export async function onRequest(ctx: PagesContext): Promise<Response> {
  const { request, next } = ctx;
  const url = new URL(request.url);
  const path = url.pathname;

  // Statik fayllar (js/css/json/webp...)
  if (isStaticAsset(path) && !path.endsWith('.html')) {
    return next();
  }

  // Bosh sahifa — to'g'ridan-to'g'ri; rewrite qilmang
  if (path === '/') {
    return next();
  }

  // /index.html — CF o'zi 308→/ qiladi; SPA uchun ham 200 kerak emas brauzerga
  if (path === '/index.html') {
    return Response.redirect(new URL('/', request.url), 308);
  }

  // SEO snapshot to'g'ridan-to'g'ri
  if (path.startsWith('/_seo/')) {
    return next();
  }

  const ua = request.headers.get('user-agent') ?? '';
  const isBot = BOT_UA.test(ua);

  if (isBot) {
    const seo = seoSnapshotPath(path);
    if (seo) {
      const res = await fetchAsset(ctx, seo);
      if (res.ok) {
        // URL brauzerda /mavzuli — kesh kaliti ham shu. no-store majburiy.
        return withHtmlHeaders(res, {
          'Cache-Control': SPA_NO_STORE,
          'CDN-Cache-Control': 'no-store',
          Vary: 'User-Agent',
        });
      }
    }
    const res = await next();
    if (res.status >= 300 && res.status < 400) {
      return serveSpaShell(ctx);
    }
    return withHtmlHeaders(res, {
      'Cache-Control': SPA_NO_STORE,
      'CDN-Cache-Control': 'no-store',
      Vary: 'User-Agent',
    });
  }

  if (isSpaRoute(path)) {
    return serveSpaShell(ctx);
  }

  return next();
}
