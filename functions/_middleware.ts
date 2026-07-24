/**
 * Cloudflare Pages Functions — Global Edge Middleware
 *
 * User  → React SPA (/* → /index.html 200)
 * Bot   → /_seo/.../ snapshot (faqat HTML body; SPA URL HECH QACHON keshlanmaydi)
 *
 * REDIRECT LOOP:
 *   /index.html fetch qilmang (CF 308 → /)
 *
 * KESH ZAHARLANISH:
 *   Bot SEO ni /mavzuli URL da public/s-maxage bilan bermang —
 *   CF edge HIT qilib oddiy userga ham SEO HTML beradi.
 *   SPA pathlarda faqat: private, no-store + CDN-Cache-Control: no-store
 *   Dashboard: SPA pathlar uchun Cache Rule = Bypass (majburiy)
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

/** SPA URL javoblari — edge ham, brauzer ham keshlamasin */
const SPA_NO_STORE_HEADERS: Record<string, string> = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0',
};

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

function seoSnapshotPath(pathname: string): string | null {
  const clean = cleanPath(pathname);
  if (SEO_EXACT.includes(clean)) return `/_seo${clean}/`;
  if (clean.startsWith('/savol/')) return `/_seo${clean}/`;
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

const SKIP_FROM_ASSET =
  /^(cache-control|cdn-cache-control|cloudflare-cdn-cache-control|age|expires|etag|last-modified|pragma|vary)$/i;

function withHtmlHeaders(
  res: Response,
  extra: Record<string, string>,
): Response {
  const headers = new Headers();
  res.headers.forEach((value, key) => {
    if (!SKIP_FROM_ASSET.test(key)) headers.set(key, value);
  });
  headers.set('Content-Type', 'text/html; charset=utf-8');
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

async function serveSpaShell(ctx: PagesContext): Promise<Response> {
  const res = await ctx.next();

  if (res.status >= 300 && res.status < 400) {
    const viaAssets = await fetchAsset(ctx, '/');
    if (viaAssets.ok) {
      return withHtmlHeaders(viaAssets, {
        ...SPA_NO_STORE_HEADERS,
        Vary: 'User-Agent',
      });
    }
    return new Response('Sahifa yuklanmadi.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...SPA_NO_STORE_HEADERS,
      },
    });
  }

  return withHtmlHeaders(res, {
    ...SPA_NO_STORE_HEADERS,
    Vary: 'User-Agent',
  });
}

export async function onRequest(ctx: PagesContext): Promise<Response> {
  const { request, next } = ctx;
  const url = new URL(request.url);
  const path = url.pathname;

  if (isStaticAsset(path) && !path.endsWith('.html')) {
    return next();
  }

  if (path === '/') {
    return next();
  }

  if (path === '/index.html') {
    return Response.redirect(new URL('/', request.url), 308);
  }

  // /_seo/* — faqat shu yerda edge kesh ruxsat (Cache Rule 2)
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
        // Body SEO, lekin URL /mavzuli — keshlanmasin!
        return withHtmlHeaders(res, {
          ...SPA_NO_STORE_HEADERS,
          Vary: 'User-Agent',
        });
      }
    }
    const res = await next();
    if (res.status >= 300 && res.status < 400) {
      return serveSpaShell(ctx);
    }
    return withHtmlHeaders(res, {
      ...SPA_NO_STORE_HEADERS,
      Vary: 'User-Agent',
    });
  }

  if (isSpaRoute(path)) {
    return serveSpaShell(ctx);
  }

  return next();
}
