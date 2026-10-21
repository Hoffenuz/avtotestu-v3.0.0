/**
 * Asosiy sahifalar uchun SEO snapshot (faqat botlar uchun).
 * scripts/seo-templates/*.html → public/_seo/{route}/index.html
 *
 * MUHIM: shablonlar public/ ICHIDA emas (scripts/seo-templates/) — aks holda
 * Vite ularni dist/static/*.html sifatida chiqarib, Cloudflare Pages haqiqiy
 * foydalanuvchilarga ham xom/eskirgan statik HTML'ni to'g'ridan-to'g'ri
 * (SPA'siz) berib qo'yadi (masalan /static/test-ishlash.html).
 * public/{route}/index.html ga ham YOZILMAYDI — aks holda CF Pages
 * refreshda React SPA o'rniga statik HTML beradi (middleware ishlamasa ham).
 * Botlar functions/_middleware.ts orqali /_seo/... ni oladi.
 *
 * Ishga tushirish: node scripts/generate-main-pages.cjs
 */

const fs = require("fs");
const path = require("path");
const { signSlug } = require("./lib/seo-slug.cjs");

const ROOT = path.join(__dirname, "..");
const STATIC_SRC = path.join(ROOT, "scripts/seo-templates");
const PUBLIC = path.join(ROOT, "public");
const INDEX_HTML = path.join(ROOT, "index.html");
const BASE_URL = "https://www.avtotestu.uz";
const BRAND = "AvtoSmart";

const ROUTE_MAP = {
  "test-ishlash.html": "test-ishlash",
  "belgilar.html": "belgilar",
  "variant.html": "variant",
  "mavzuli.html": "mavzuli",
  "darslik.html": "darslik",
  "qoshimcha.html": "qoshimcha",
  "pro.html": "pro",
  "contact.html": "contact",
  // Yangi bo'limlar — bularsiz Googlebot xom HTML da bosh sahifaning
  // sarlavhasini ko'rardi va sahifalar takror deb baholanardi.
  "bolimlar.html": "bolimlar",
  "avtodrom.html": "avtodrom",
  "yodlash-kerak.html": "yodlash-kerak",
  "real-imtihon.html": "real-imtihon",
  "qidirish.html": "qidirish",
  "qiyin-savollar.html": "qiyin-savollar",
  // E-avtomaktab klasteri: "e avtomaktab" so'rovlari 28 kunda 81 792 marta
  // ko'rsatilgan, CTR 0,4%. Bu sahifalar aynan o'sha niyatga javob beradi.
  "e-avtomaktab.html": "e-avtomaktab",
  "e-avtomaktab-test.html": "e-avtomaktab-test",
  "avtoimtihon-2026.html": "avtoimtihon-2026",
  // "prava olish narxi / tartibi 2026" — saytda narx va muddat haqida
  // ma'lumot yo'q edi, bu savollarga boshqa saytlar javob berardi.
  "prava-olish.html": "prava-olish",
};

function applyContentFixes(html) {
  return html
    .replace(/40\+ test varianti/gi, "63 ta test varianti")
    .replace(/40\+ Variant/gi, "63 ta Variant")
    .replace(/40\+ variant/gi, "63 ta variant")
    .replace(/40 ta variant/gi, "63 ta variant")
    .replace(/Barcha 40\+ variant/gi, "Barcha 63 ta variant")
    .replace(/"numberOfItems": 300/g, '"numberOfItems": 269')
    .replace(/700\+ savol/g, "1250+ savol")
    .replace(/700 ta umumiy savollar/gi, "1250+ ta savollar")
    .replace(/600\+ bepul savol/g, "1250+ savol")
    .replace(/600\+ ta bepul savollar/gi, "1250+ ta savollar")
    .replace(/6[12] variant/gi, "63 ta variant")
    .replace(/6[12] ta variant/gi, "63 ta variant")
    .replace(/6[12] ta to'liq variant/gi, "63 ta to'liq variant")
    .replace(/6[12] ta test varianti/gi, "63 ta test varianti")
    .replace(/Avtotestu/g, "AvtoSmart")
    .replace(/og:site_name" content="Avtotestlar(?:\.uz)?"/g, `og:site_name" content="${BRAND}"`);
}

/**
 * Bot snapshot'ining sarlavha va tavsifini React ilova ishlatadigan
 * MATNGA moslaydi.
 *
 * NEGA KERAK: shablonlar qo'lda yozilgan, React esa matnni
 * `src/locales/*.json` dan oladi. Ikki manba vaqt o'tib bir-biridan
 * uzoqlashdi — 18 sahifadan 13 tasida Google BOSHQA sarlavhani,
 * foydalanuvchi BOSHQA sarlavhani ko'rardi. Endi manba bitta:
 * `functions/_seo-meta.ts` (u ham locale'lardan yasaladi).
 *
 * Qo'shimcha qoida `src/components/SEO.tsx` dagi bilan bir xil.
 */
function readSeoMeta() {
  const p = path.join(ROOT, "functions/_seo-meta.ts");
  if (!fs.existsSync(p)) return null;
  const src = fs.readFileSync(p, "utf-8");
  const boshi = src.indexOf("= {") + 2;
  const oxiri = src.lastIndexOf("};") + 1;
  try {
    return JSON.parse(src.slice(boshi, oxiri));
  } catch {
    return null;
  }
}

const SEO_META = readSeoMeta();

/** `"` va `&` atribut ichida xavfsiz bo'lishi uchun. */
function escAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function syncTitleAndDescription(html, route) {
  const meta = SEO_META?.[`/${route}`]?.["uz-lat"];
  if (!meta) return html;

  const title = `${meta.title} | ${BRAND}`;
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escAttr(meta.description)}">`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${escAttr(title)}">`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${escAttr(meta.description)}">`,
    );
}

/* ---------------------------------------------------------------------------
 * Dinamik bo'laklar: tushuntirish matni, FAQ sxemasi, belgilar katalogi.
 *
 * Matn `src/data/seo/guides.json` dan olinadi. U faqat botlarga beriladigan
 * nusxada turadi: foydalanuvchi sahifasida bu uzun matn ko'rsatilmaydi
 * (sodda interfeys uchun egasining qarori, 2026-10-21).
 *
 * Belgilar katalogi `public/data/belgilar.json` dan yasaladi: ilgari
 * shablonda qo'lda yozilgan, saytning o'z ma'lumotiga mos kelmaydigan
 * ro'yxat (noto'g'ri guruh raqamlari, mavjud bo'lmagan nomlar) turardi.
 * ------------------------------------------------------------------------- */
const GUIDE_PAGE = { "test-ishlash": "testIshlash", belgilar: "belgilar" };

const GUIDES = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/seo/guides.json"), "utf-8"));
const SIGN_GROUPS = JSON.parse(fs.readFileSync(path.join(PUBLIC, "data/belgilar.json"), "utf-8"));
const TOTAL_SIGNS = SIGN_GROUPS.reduce((n, g) => n + g.items.length, 0);

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function guideVars() {
  return { count: TOTAL_SIGNS, groups: SIGN_GROUPS.length };
}

function fillVars(text) {
  const vars = guideVars();
  return String(text).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function renderGuideHtml(page) {
  const g = GUIDES[page]["uz-lat"];
  // Sahifadagi (SeoGuide.tsx) bilan bir xil: matn yopiq <details> ichida.
  const out = [`<details class="guide-wrap"><summary>${esc(g.moreLabel)}</summary>`, '<div class="guide">'];
  for (const sec of g.sections) {
    out.push(`<h2>${esc(sec.title)}</h2>`);
    for (const p of sec.paragraphs || []) out.push(`<p>${esc(fillVars(p))}</p>`);
    for (const it of sec.list || []) {
      out.push(`<h3>${esc(it.name)}</h3>`, `<p>${esc(fillVars(it.text))}</p>`);
    }
    if (sec.bullets) out.push(`<ul>${sec.bullets.map((b) => `<li>${esc(fillVars(b))}</li>`).join("")}</ul>`);
  }
  out.push(`<h2>${esc(g.faqTitle)}</h2>`);
  for (const f of g.faq) {
    out.push(`<details><summary>${esc(fillVars(f.q))}</summary><p>${esc(fillVars(f.a))}</p></details>`);
  }
  out.push(`<h2>${esc(g.linksTitle)}</h2>`);
  out.push(`<ul class="guide-links">${g.links.map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join("")}</ul>`);
  out.push("</div>", "</details>");
  return out.join("\n");
}

function renderFaqJsonLd(page) {
  const g = GUIDES[page]["uz-lat"];
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: g.faq.map((f) => ({
      "@type": "Question",
      name: fillVars(f.q),
      acceptedAnswer: { "@type": "Answer", text: fillVars(f.a) },
    })),
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`;
}

/** Faqat alohida sahifasi BOR belgilarga havola qo'yiladi (singan havola bo'lmasin). */
function publishedSignSlugs() {
  const dir = path.join(PUBLIC, "_seo", "belgilar");
  if (!fs.existsSync(dir)) return new Set();
  return new Set(
    fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, "index.html"))),
  );
}

function renderSignCatalogHtml() {
  const published = publishedSignSlugs();
  const parts = ['<div class="categories">'];
  for (const group of SIGN_GROUPS) {
    parts.push(
      '<article class="category">',
      `<h2>${esc(group.title.uz_lat)}<span class="group-count">${group.items.length} ta belgi</span></h2>`,
      '<ul class="signs-list">',
    );
    for (const item of group.items) {
      const title = item.title.uz_lat;
      const img = `<img src="${esc(item.src)}" alt="${esc(title)}" loading="lazy" width="48" height="48">`;
      const slug = item.code ? signSlug(item.code, title) : "";
      const inner = `${img}<span>${esc(title)}</span>`;
      parts.push(
        published.has(slug)
          ? `<li><a href="/belgilar/${esc(slug)}">${inner}</a></li>`
          : `<li><span class="sign">${inner}</span></li>`,
      );
    }
    parts.push("</ul>", "</article>");
  }
  parts.push("</div>");
  return parts.join("\n");
}

function renderItemListJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "O'zbekiston yo'l belgilari",
    description: "Yo'l belgilarining to'liq katalogi",
    numberOfItems: TOTAL_SIGNS,
    itemListElement: SIGN_GROUPS.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${g.title.uz_lat} (${g.items.length} ta)`,
    })),
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`;
}

/** Belgilangan o'rinni almashtiradi; o'rin topilmasa XATO beradi (jim qolmaydi). */
function replaceMarker(html, marker, value, route) {
  if (!html.includes(marker)) {
    console.error(`❌ ${route}: shablonda ${marker} yo'q`);
    process.exit(1);
  }
  return html.split(marker).join(value);
}

function injectDynamic(html, route) {
  if (route === "yodlash-kerak") {
    return replaceMarker(html, "<!--YODLASH_TOPICS-->", renderYodlashTopicList(), route);
  }
  const page = GUIDE_PAGE[route];
  if (!page) return html;
  html = replaceMarker(html, "<!--SEO_GUIDE-->", renderGuideHtml(page), route);
  if (route === "test-ishlash") {
    html = replaceMarker(html, "<!--FAQ_JSONLD-->", renderFaqJsonLd(page), route);
  }
  if (route === "belgilar") {
    html = replaceMarker(html, "<!--SIGN_CATALOG-->", renderSignCatalogHtml(), route);
    html = replaceMarker(html, "<!--ITEMLIST_JSONLD-->", renderItemListJsonLd(), route);
    html = replaceMarker(html, "<!--SIGN_COUNT-->", String(TOTAL_SIGNS), route);
    // Belgilar sahifasining FAQ sxemasi ham guides.json dan
    html = html.replace("</head>", `  ${renderFaqJsonLd(page)}\n</head>`);
  }
  return html;
}

/* ---------------------------------------------------------------------------
 * "Yodlash kerak" mavzulari — har biri uchun alohida bot snapshot.
 *
 * NEGA KERAK: `/yodlash-kerak/tezlik` kabi 9 ta sahifa sitemap'da bor, lekin
 * snapshot'i yo'q edi — Googlebot xom HTML'da BOSH SAHIFA sarlavhasini
 * ko'rardi va ularni takror sahifa deb baholashi mumkin edi.
 *
 * Matn `src/data/seo/yodlash-kerak.json` dan — React sahifa
 * (`YodlashKerakMavzu.tsx`) ham aynan shu fayldan o'qiydi, ya'ni bot bilan
 * odam bir xil mazmunni ko'radi. Sarlavha/tavsif `_seo-meta.ts` dan
 * (`generate-seo-meta.cjs` uni shu JSON'dan yasaydi).
 * ------------------------------------------------------------------------- */
const YODLASH_TOPICS = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/seo/yodlash-kerak.json"), "utf-8"),
);
const UZ_LAT = JSON.parse(fs.readFileSync(path.join(ROOT, "src/locales/uz-lat.json"), "utf-8"));

/** Hub sahifadagi mavzular ro'yxati — har biriga havola (ichki bog'lanish). */
function renderYodlashTopicList() {
  const items = YODLASH_TOPICS.map(
    (t) =>
      `        <li><a href="/yodlash-kerak/${esc(t.id)}"><strong>${esc(t.title.oz)}</strong></a> — ${esc(t.subtitle.oz)}</li>`,
  ).join("\n");
  return `    <article class="info-card">
      <h2>Mavzular</h2>
      <ul>
${items}
      </ul>
    </article>`;
}

function renderYodlashTopicPage(topic) {
  const route = `/yodlash-kerak/${topic.id}`;
  const meta = SEO_META?.[route]?.["uz-lat"];
  if (!meta) {
    console.error(`❌ ${route}: _seo-meta.ts da yozuv yo'q (avval generate-seo-meta.cjs)`);
    process.exit(1);
  }
  const title = `${meta.title} | ${BRAND}`;
  const url = `${BASE_URL}${route}`;
  const hubName = UZ_LAT.sections.yodlashKerak;

  const alternates = [
    ["uz-Latn", url],
    ["uz-Cyrl", `${BASE_URL}/cyr${route}`],
    ["ru", `${BASE_URL}/ru${route}`],
    ["x-default", url],
  ]
    .map(([lang, href]) => `  <link rel="alternate" hreflang="${lang}" href="${href}">`)
    .join("\n");

  const groups = topic.groups
    .map((g) => {
      const rows = g.rows
        .map(
          (r) =>
            `          <tr><td>${esc(r.label.oz)}</td><td class="val">${esc(r.value)} ${esc(r.unit.oz)}</td></tr>`,
        )
        .join("\n");
      return `    <section class="info-card">
      <h2>${esc(g.heading.oz)}</h2>
      <table>
        <tbody>
${rows}
        </tbody>
      </table>
    </section>`;
    })
    .join("\n\n");

  const others = YODLASH_TOPICS.filter((t) => t.id !== topic.id)
    .map((t) => `<li><a href="/yodlash-kerak/${esc(t.id)}">${esc(t.title.oz)}</a></li>`)
    .join("");

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: `${BASE_URL}/` },
      { "@type": "ListItem", position: 2, name: hubName, item: `${BASE_URL}/yodlash-kerak` },
      { "@type": "ListItem", position: 3, name: topic.title.oz, item: url },
    ],
  };

  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${escAttr(meta.description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">
${alternates}
  <link rel="icon" href="/favicon.ico">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escAttr(title)}">
  <meta property="og:description" content="${escAttr(meta.description)}">
  <meta property="og:image" content="${BASE_URL}/avtosmart-og.jpg">
  <meta property="og:locale" content="uz_UZ">
  <meta property="og:site_name" content="${BRAND}">
  <script type="application/ld+json">
${JSON.stringify(breadcrumbLd, null, 2)}
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a202c; background: #f7fafc; }
    .header { background: #1a365d; color: #fff; padding: 16px 20px; }
    .header a { color: #fff; text-decoration: none; font-weight: 700; font-size: 20px; }
    .breadcrumb { max-width: 900px; margin: 20px auto 0; padding: 0 20px; color: #718096; font-size: 14px; }
    .breadcrumb a { color: #1a365d; text-decoration: none; }
    .section { padding: 24px 20px 40px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 2rem; color: #1a365d; margin-bottom: 12px; }
    .intro { color: #4a5568; margin-bottom: 28px; }
    .info-card { background: #fff; padding: 24px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .info-card h2 { color: #1a365d; font-size: 1.15rem; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 10px 0; border-top: 1px solid #edf2f7; color: #2d3748; vertical-align: top; }
    tr:first-child td { border-top: 0; }
    td.val { text-align: right; font-weight: 700; color: #1a365d; white-space: nowrap; padding-left: 16px; }
    .note { font-size: 13px; color: #718096; margin-top: 8px; }
    .more ul { padding-left: 20px; color: #4a5568; }
    .more li { margin-bottom: 6px; }
    .more a { color: #1a365d; }
    .footer { background: #1a365d; color: rgba(255,255,255,0.8); padding: 32px 20px; text-align: center; margin-top: 40px; }
  </style>
</head>
<body>
  <header class="header"><a href="/">${BRAND}</a></header>

  <nav class="breadcrumb">
    <a href="/">Bosh sahifa</a> → <a href="/yodlash-kerak">${esc(hubName)}</a> → <span>${esc(topic.title.oz)}</span>
  </nav>

  <main class="section">
    <h1>${esc(topic.title.oz)}</h1>
    <p class="intro">${esc(topic.subtitle.oz)}</p>

${groups}

    <p class="note">${esc(UZ_LAT.pages.yodlashKerakNote)}</p>

    <section class="info-card more">
      <h2>Boshqa mavzular</h2>
      <ul>${others}</ul>
      <p style="margin-top:12px"><a href="/mavzuli">Mavzuli testlar</a> · <a href="/test-ishlash">Onlayn test ishlash</a></p>
    </section>
  </main>

  <footer class="footer">
    <p>© ${new Date().getFullYear()} ${BRAND} — O'zbekistonda haydovchilik guvohnomasi uchun YHQ testlari</p>
  </footer>
</body>
</html>
`;
}

function writeYodlashTopicPages() {
  const baseDir = path.join(PUBLIC, "_seo", "yodlash-kerak");
  fs.mkdirSync(baseDir, { recursive: true });
  const ids = new Set(YODLASH_TOPICS.map((t) => t.id));

  // Olib tashlangan / nomi o'zgargan mavzuning eski snapshot'i qolmasin
  for (const name of fs.readdirSync(baseDir)) {
    const full = path.join(baseDir, name);
    if (fs.statSync(full).isDirectory() && !ids.has(name)) {
      fs.rmSync(full, { recursive: true, force: true });
      console.log(`🗑️  removed /_seo/yodlash-kerak/${name}/ (mavzu yo'q)`);
    }
  }

  for (const topic of YODLASH_TOPICS) {
    const outDir = path.join(baseDir, topic.id);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), renderYodlashTopicPage(topic), "utf-8");
  }
  console.log(`✅ /_seo/yodlash-kerak/<mavzu>/index.html — ${YODLASH_TOPICS.length} ta`);
}

function copyRoutePages() {
  for (const [file, route] of Object.entries(ROUTE_MAP)) {
    const src = path.join(STATIC_SRC, file);
    if (!fs.existsSync(src)) {
      console.warn(`⚠️  Skip missing: ${file}`);
      continue;
    }
    let html = applyContentFixes(fs.readFileSync(src, "utf-8"));
    html = injectDynamic(html, route);
    html = syncTitleAndDescription(html, route);
    const outDir = path.join(PUBLIC, "_seo", route);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
    console.log(`✅ /_seo/${route}/index.html`);

    // Eski joydagi shadow faylni olib tashlash (SPA ni bloklaydi)
    const legacy = path.join(PUBLIC, route, "index.html");
    if (fs.existsSync(legacy)) {
      fs.unlinkSync(legacy);
      console.log(`🗑️  removed /${route}/index.html (SPA shadow)`);
    }
  }
}

function writeDesktopPage() {
  const html = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Desktop ilova | ${BRAND} — Offline test</title>
  <meta name="description" content="Windows uchun offline YHQ test ilovasi: internetsiz test ishlang, katta ekranda qulay o'rganing. Bepul yuklab oling.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE_URL}/desktop">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE_URL}/desktop">
  <meta property="og:title" content="Desktop ilova | ${BRAND}">
  <meta property="og:description" content="Windows uchun offline YHQ test ilovasi. Internet bo'lmasa ham test ishlang.">
  <meta property="og:site_name" content="${BRAND}">
  <meta property="og:image" content="${BASE_URL}/avtosmart-og.jpg">
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.65; color: #1a202c; background: #f7fafc; margin: 0; }
    .wrap { max-width: 760px; margin: 0 auto; padding: 32px 16px 48px; }
  </style>
</head>
<body>
  <div class="wrap">
    <nav style="margin-bottom:20px;font-size:14px"><a href="/">Bosh sahifa</a> · <a href="/test-ishlash">Test ishlash</a></nav>
    <h1 style="color:#1E2350">AvtoSmart Desktop ilova</h1>
    <p>Windows kompyuter uchun mahalliy ilova. Internet bo'lmasa ham YHQ testlarini ishlang, katta ekranda qulay o'rganing.</p>
    <h2 style="color:#1E2350;font-size:1.1rem;margin-top:24px">Afzalliklar</h2>
    <ul>
      <li>Internet bo'lmasa ham test ishlang</li>
      <li>Katta ekranda qulay interfeys</li>
      <li>Tez va barqaror mahalliy ilova</li>
      <li>1275 ta savollar bazasi (PRO litsenziya bilan)</li>
    </ul>
    <p style="margin-top:24px"><a href="https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/ilova/AvtoSmart-Setup.exe" style="background:#1E2350;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Ilovani yuklab olish (.exe)</a></p>
    <p style="margin-top:16px;font-size:14px;color:#64748b">Mobil qurilmada bu sahifadan yuklab olish mumkin emas — kompyuter yoki noutbukdan kiring.</p>
  </div>
</body>
</html>`;
  const outDir = path.join(PUBLIC, "_seo", "desktop");
  fs.mkdirSync(outDir, { recursive: true });
  // Sarlavha/tavsif React ilova bilan bitta manbadan bo'lsin — shablonli
  // sahifalarda `copyRoutePages` shuni qiladi, bu sahifa esa kod ichida
  // yasalgani uchun bu yerda alohida o'tkaziladi.
  fs.writeFileSync(
    path.join(outDir, "index.html"),
    syncTitleAndDescription(html, "desktop"),
    "utf-8",
  );
  console.log("✅ /_seo/desktop/index.html");

  const legacy = path.join(PUBLIC, "desktop", "index.html");
  if (fs.existsSync(legacy)) {
    fs.unlinkSync(legacy);
    console.log("🗑️  removed /desktop/index.html (SPA shadow)");
  }
}

function patchHomeNoscript() {
  const staticHome = path.join(STATIC_SRC, "index.html");
  if (!fs.existsSync(staticHome) || !fs.existsSync(INDEX_HTML)) return;

  const staticHtml = applyContentFixes(fs.readFileSync(staticHome, "utf-8"));
  const bodyMatch = staticHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return;

  const simplified = bodyMatch[1]
    .replace(/<header[\s\S]*?<\/header>/i, "")
    .replace(/class="[^"]*"/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const noscriptBlock = `<noscript>
        <div style="font-family:system-ui,sans-serif;color:#1a202c">
          <header style="padding:20px;background:#1a365d;color:#fff;text-align:center">
            <h1>AvtoSmart — Haydovchilik guvohnomasi uchun YHQ testlari</h1>
            <p style="margin-top:8px;opacity:.9">2026 yil yangilangan savollar, yo'l belgilari va onlayn testlar</p>
          </header>
          ${simplified}
          <footer style="padding:20px;background:#f7fafc;text-align:center;margin-top:32px">
            <p>© ${new Date().getFullYear()} AvtoSmart — O'zbekistonda haydovchilik guvohnomasi uchun YHQ testlari</p>
          </footer>
        </div>
      </noscript>`;

  let indexHtml = fs.readFileSync(INDEX_HTML, "utf-8");
  indexHtml = indexHtml.replace(/<noscript>[\s\S]*?<\/noscript>/, noscriptBlock);
  fs.writeFileSync(INDEX_HTML, indexHtml, "utf-8");
  console.log("✅ index.html noscript yangilandi");
}

/**
 * `functions/_middleware.ts` dagi SEO_EXACT bilan solishtiradi.
 *
 * Ikki ro'yxat ajralib ketsa xato JIMGINA sodir bo'ladi: middleware botni
 * mavjud bo'lmagan `/_seo/...` ga yuboradi yoki aksincha, tayyor snapshot
 * hech qachon ishlatilmaydi. Ikkalasi ham faqat productionda bilinadi.
 */
function assertMiddlewareInSync() {
  const mwPath = path.join(ROOT, "functions/_middleware.ts");
  if (!fs.existsSync(mwPath)) return;

  const block = fs.readFileSync(mwPath, "utf-8").match(/SEO_EXACT[^=]*=\s*\[([\s\S]*?)\]/);
  if (!block) return;

  // Izohlarni olib tashlaymiz — o'zbekcha matndagi apostrof qator
  // chegarasi deb o'qilib, xato "marshrut" hosil qilardi.
  const body = block[1].replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const inMiddleware = [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const generated = [...Object.values(ROUTE_MAP), "desktop"].map((r) => `/${r}`);

  const missing = inMiddleware.filter((r) => !generated.includes(r));
  const unused = generated.filter((r) => !inMiddleware.includes(r));

  if (missing.length || unused.length) {
    console.error("\n❌ SEO_EXACT va ROUTE_MAP mos emas:");
    if (missing.length) {
      console.error(`   _middleware.ts da bor, snapshot YO'Q: ${missing.join(", ")}`);
    }
    if (unused.length) {
      console.error(`   snapshot bor, _middleware.ts da YO'Q: ${unused.join(", ")}`);
    }
    process.exit(1);
  }
  console.log(`✅ _middleware.ts bilan mos (${generated.length} ta marshrut)`);
}

/**
 * `src/App.tsx` dagi HAR BIR marshrut `_middleware.ts` dagi SPA_PREFIXES
 * bilan qamralganini tekshiradi.
 *
 * NEGA SHART: middleware ro'yxatda yo'q manzilni "mavjud emas" deb 404
 * status bilan qaytaradi (soft 404 tuzatishi). Yangi sahifa App.tsx ga
 * qo'shilib, bu ro'yxatga qo'shilmasa, u brauzerda ochilaveradi-yu,
 * Google uni 404 deb indeksdan chiqarib yuboradi — buni hech kim sezmaydi.
 */
function assertSpaRoutesCovered() {
  const mw = fs.readFileSync(path.join(ROOT, "functions/_middleware.ts"), "utf-8");
  const block = mw.match(/SPA_PREFIXES[^=]*=\s*\[([\s\S]*?)\];/);
  if (!block) {
    console.error("❌ _middleware.ts: SPA_PREFIXES topilmadi");
    process.exit(1);
  }
  const body = block[1].replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const prefixes = [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);

  const app = fs.readFileSync(path.join(ROOT, "src/App.tsx"), "utf-8");
  const routes = [...app.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((r) => r !== "*" && r !== "/");

  const covered = (r) => {
    const base = r.replace(/\/:[^/]+.*$/, "") || "/";
    return prefixes.some((p) => base === p || base.startsWith(p + "/"));
  };
  const missing = routes.filter((r) => !covered(r));
  if (missing.length) {
    console.error("\n❌ App.tsx marshruti _middleware.ts SPA_PREFIXES da YO'Q (404 qaytaradi):");
    console.error(`   ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log(`✅ App.tsx marshrutlari SPA_PREFIXES bilan qamralgan (${routes.length} ta)`);
}

console.log("🔧 Asosiy sahifalar statik HTML yaratilmoqda...\n");
copyRoutePages();
writeYodlashTopicPages();
writeDesktopPage();
assertMiddlewareInSync();
assertSpaRoutesCovered();
patchHomeNoscript();
console.log("\n✨ Tayyor!");
