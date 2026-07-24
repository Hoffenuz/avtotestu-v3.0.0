/**
 * Cloudflare Pages Functions — Global Edge Middleware
 *
 * User  → React SPA (ASSETS `/` yoki next bir marta)
 * Bot   → /_seo/.../ snapshot (SPA URL da no-store)
 *
 * QAT'IY:
 *   - context.next() bir so'rovda faqat BIR marta
 *   - SPA URL da public/s-maxage yo'q (kesh zaharlanishi)
 *   - /index.html fetch qilmang (CF 308 → /)
 *   - isStaticAsset faqat haqiqiy kengaytmalar (1.3.1 belgi kodi emas)
 *
 * ASSETS: Pages Functions da avtomatik binding
 *   https://developers.cloudflare.com/pages/functions/api-reference/
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

const SPA_NO_STORE_HEADERS: Record<string, string> = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0',
};

/** Faqat haqiqiy fayl kengaytmalari — /belgilar/1.3.1 kabi belgi kodlari emas */
function isStaticAsset(pathname: string): boolean {
  return /\.(html?|css|js|mjs|json|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|eot|txt|xml|map|pdf|avif|mp4|webm|wasm)$/i.test(
    pathname,
  );
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

function needsSpaFallback(status: number): boolean {
  return (status >= 300 && status < 400) || status === 404;
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

/**
 * Statik asset — faqat ASSETS.fetch (next() chaqirmaydi).
 * Pretty path: /_seo/mavzuli/ (index.html emas).
 */
async function fetchAsset(
  ctx: PagesContext,
  absolutePath: string,
): Promise<Response | null> {
  if (!ctx.env.ASSETS?.fetch) return null;

  const url = new URL(absolutePath, ctx.request.url);
  return ctx.env.ASSETS.fetch(
    new Request(url.toString(), {
      method: 'GET',
      headers: ctx.request.headers,
      redirect: 'follow',
    }),
  );
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

function spaUnavailable(): Response {
  return new Response('Sahifa yuklanmadi.', {
    status: 503,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...SPA_NO_STORE_HEADERS,
    },
  });
}

/**
 * SPA shell. next() eng ko'pi bilan bir marta.
 * Avvalo ASSETS `/` — ikkinchi next() kerak emas.
 */
async function serveSpaShell(ctx: PagesContext): Promise<Response> {
  const viaAssets = await fetchAsset(ctx, '/');
  if (viaAssets?.ok) {
    return withHtmlHeaders(viaAssets, {
      ...SPA_NO_STORE_HEADERS,
      Vary: 'User-Agent',
    });
  }

  // ASSETS yo'q yoki xato — bitta next(); _redirects SPA fallback
  const res = await ctx.next();
  if (needsSpaFallback(res.status)) {
    // next() allaqachon chaqirilgan — qayta chaqirmaymiz
    return spaUnavailable();
  }

  return withHtmlHeaders(res, {
    ...SPA_NO_STORE_HEADERS,
    Vary: 'User-Agent',
  });
}

/**
 * next() natijasidan keyin SPA kerak bo'lsa — faqat ASSETS (ikkinchi next yo'q).
 */
async function spaFromAssetsOnly(ctx: PagesContext): Promise<Response> {
  const viaAssets = await fetchAsset(ctx, '/');
  if (viaAssets?.ok) {
    return withHtmlHeaders(viaAssets, {
      ...SPA_NO_STORE_HEADERS,
      Vary: 'User-Agent',
    });
  }
  return spaUnavailable();
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

  if (path.startsWith('/_seo/')) {
    return next();
  }

  const ua = request.headers.get('user-agent') ?? '';
  const isBot = BOT_UA.test(ua);

  if (isBot) {
    const seo = seoSnapshotPath(path);
    if (seo) {
      const seoRes = await fetchAsset(ctx, seo);
      if (seoRes?.ok) {
        return withHtmlHeaders(seoRes, {
          ...SPA_NO_STORE_HEADERS,
          Vary: 'User-Agent',
        });
      }
      // ASSETS yo'q: birinchi (va yagona) next — SEO path
      if (!ctx.env.ASSETS?.fetch) {
        const res = await next(seo);
        if (res.ok) {
          return withHtmlHeaders(res, {
            ...SPA_NO_STORE_HEADERS,
            Vary: 'User-Agent',
          });
        }
        if (needsSpaFallback(res.status)) {
          return spaFromAssetsOnly(ctx);
        }
        return withHtmlHeaders(res, {
          ...SPA_NO_STORE_HEADERS,
          Vary: 'User-Agent',
        });
      }
    }

    // SEO yo'q yoki ASSETS SEO bermadi — SPA (next() bu yerda hali chaqirilmagan)
    return serveSpaShell(ctx);
  }

  if (isSpaRoute(path)) {
    return serveSpaShell(ctx);
  }

  return next();
}
