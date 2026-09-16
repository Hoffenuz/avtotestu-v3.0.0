/**
 * Yo'l belgilari uchun Google SEO snapshotlari.
 * Chiqish: public/_seo/belgilar/{slug}/index.html
 *
 * NIMA UCHUN KERAK: `/belgilar` sahifasi oyiga ~15 000 ko'rsatish oladi,
 * lekin 269 ta belgining BIRORTASIDA ham alohida manzil yo'q edi. Ya'ni
 * "to'xtash taqiqlangan belgisi" kabi aniq so'rovlar uchun mos sahifa
 * mavjud emasdi.
 *
 * YUPQA KONTENT MUAMMOSI: belgi ma'lumotida faqat nom va rasm bor
 * (tavsif yo'q). Shunday sahifa Google nazarida "yupqa" hisoblanadi.
 * Shuning uchun sahifa O'SHA BELGIGA TEGISHLI TEST SAVOLLARI bilan
 * to'ldiriladi va savoli YO'Q belgilar uchun sahifa UMUMAN yaratilmaydi.
 *
 * Savol–belgi bog'lanishi `barcha-uz-lat.json` dagi izohdan (belgi kodi)
 * olinadi, lekin izohning O'ZI hech qayerda chop etilmaydi — u PRO
 * qiymati.
 *
 * MUHIM: `public/belgilar/` ga YOZILMAYDI — u yerda belgi RASMLARI turadi
 * va SPA marshrutini soyalab qo'ymasligi kerak.
 *
 * Ishga tushirish: node scripts/generate-belgi-pages.cjs
 * (generate-savol-pages.cjs DAN KEYIN — u savol indeksini yozadi.)
 */

const fs = require("fs");
const path = require("path");
const { signSlug } = require("./lib/seo-slug.cjs");

const ROOT = path.join(__dirname, "..");
const SIGNS_PATH = path.join(ROOT, "public/data/belgilar.json");
const SAVOL_INDEX_PATH = path.join(ROOT, "public/data/savol-index.json");
const SEO_BELGI_DIR = path.join(ROOT, "public/_seo/belgilar");
const BELGI_INDEX_PATH = path.join(ROOT, "public/data/belgi-index.json");
const SITEMAP_PATH = path.join(ROOT, "public/sitemap.xml");
const BASE_URL = "https://www.avtotestu.uz";
const BRAND = "AvtoSmart";
const TODAY = new Date().toISOString().slice(0, 10);

/** Sahifa yaratish uchun kerakli eng kam savol soni (yupqa kontentga qarshi). */
const MIN_QUESTIONS = 1;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Belgi nomidan kod prefiksini olib tashlaydi: "1.1 Shlagbaumli..." → "Shlagbaumli..." */
function cleanTitle(title) {
  return String(title || "").replace(/^\s*[\d.]+\s*/, "").trim();
}

function loadSigns() {
  const groups = JSON.parse(fs.readFileSync(SIGNS_PATH, "utf-8"));
  const signs = [];
  for (const group of groups) {
    const groupTitle = group.title.uz_lat;
    for (const item of group.items) {
      signs.push({
        code: item.code,
        rawTitle: item.title.uz_lat,
        title: cleanTitle(item.title.uz_lat),
        image: item.src,
        groupTitle,
        slug: signSlug(item.code, item.title.uz_lat),
      });
    }
  }
  return signs;
}

/** Savol indeksi — faqat CHIQARILGAN savollar (bosqichli ro'yxat). */
function loadPublishedQuestions() {
  try {
    const idx = JSON.parse(fs.readFileSync(SAVOL_INDEX_PATH, "utf-8"));
    return idx.questions || [];
  } catch {
    return [];
  }
}

/**
 * Belgi kodi → unga tegishli CHIQARILGAN savollar.
 *
 * Faqat chiqarilgan savollarga havola qo'yiladi: hali sahifasi yo'q
 * savolga havola singan bo'lardi.
 */
function questionsBySignCode(questions) {
  const map = new Map();
  for (const q of questions) {
    for (const sg of q.signs || []) {
      if (!map.has(sg.code)) map.set(sg.code, []);
      map.get(sg.code).push(q);
    }
  }
  return map;
}

function renderSignPage(sign, questions, siblings) {
  const canonical = `${BASE_URL}/belgilar/${sign.slug}`;
  const title = `${sign.code} ${sign.title} — yo'l belgisi | ${BRAND}`;
  const description =
    `${sign.code} ${sign.title} — ${sign.groupTitle.toLowerCase()} guruhiga kiradi. ` +
    `Belgi rasmi va shu belgi bo'yicha ${questions.length} ta YHQ test savoli.`;

  const questionsHtml = questions
    .map(
      (q) =>
        `<li><a href="${q.canonicalPath}">${escapeHtml(q.text)}</a>` +
        `<span class="ans">To'g'ri javob: ${escapeHtml(q.correctText)}</span></li>`,
    )
    .join("\n        ");

  const siblingsHtml = siblings
    .map((s) => `<li><a href="/belgilar/${s.slug}">${s.code} ${escapeHtml(s.title)}</a></li>`)
    .join("\n        ");

  /*
    Sxema: belgi — bu tushuncha (Thing) va sahifada uning rasmi bor.
    `ImageObject` Google Rasmlar uchun ham foydali: belgi rasmlari
    "yo'l belgisi" so'rovlarida chiqishi mumkin.
  */
  const schema = {
    "@context": "https://schema.org",
    "@type": "Thing",
    name: `${sign.code} ${sign.title}`,
    description,
    url: canonical,
    image: `${BASE_URL}${sign.image}`,
    additionalType: "https://schema.org/TrafficSign",
  };

  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${BASE_URL}${sign.image}">
  <meta property="og:site_name" content="${BRAND}">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.65; color: #1a202c; background: #f7fafc; }
    .wrap { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
    .nav { margin-bottom: 20px; font-size: 14px; }
    .nav a { color: #1E2350; text-decoration: none; margin-right: 12px; }
    .nav a:hover { text-decoration: underline; }
    h1 { font-size: 1.45rem; color: #1E2350; margin-bottom: 8px; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
    .figure { margin: 20px 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; }
    .figure img { max-width: 220px; width: 100%; height: auto; }
    .figure figcaption { margin-top: 10px; font-size: 13px; color: #64748b; }
    section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
    section h2 { font-size: 1rem; color: #1E2350; margin-bottom: 10px; }
    ul { list-style: none; }
    li { margin-bottom: 10px; font-size: 14px; }
    a { color: #1E2350; }
    .ans { display: block; font-size: 12px; color: #15803d; margin-top: 2px; }
    footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center; }
    .cta { display: inline-block; margin-top: 12px; padding: 10px 18px; background: #eab308; color: #1E2350; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
  </style>
</head>
<body>
  <div class="wrap">
    <nav class="nav">
      <a href="/">Bosh sahifa</a>
      <a href="/belgilar">Yo'l belgilari</a>
      <a href="/test-ishlash">Test ishlash</a>
    </nav>
    <h1>${escapeHtml(sign.code)} ${escapeHtml(sign.title)}</h1>
    <p class="meta">Yo'l belgisi · ${escapeHtml(sign.groupTitle)}</p>
    <figure class="figure">
      <img src="${sign.image}" alt="${escapeHtml(sign.code)} ${escapeHtml(sign.title)} yo'l belgisi" width="220" height="220" loading="lazy">
      <figcaption>${escapeHtml(sign.code)} — ${escapeHtml(sign.title)}</figcaption>
    </figure>

    <section>
      <h2>Shu belgi bo'yicha test savollari (${questions.length} ta)</h2>
      <ul>
        ${questionsHtml}
      </ul>
      <a class="cta" href="/test-ishlash">Onlayn test topshirish</a>
    </section>

    ${siblings.length
      ? `<section>
      <h2>${escapeHtml(sign.groupTitle)} — boshqa belgilar</h2>
      <ul>
        ${siblingsHtml}
      </ul>
    </section>`
      : ""}

    <footer>© ${new Date().getFullYear()} ${BRAND} — Yo'l harakati qoidalari va yo'l belgilari</footer>
  </div>
</body>
</html>`;
}

function writePage(slug, html) {
  const dir = path.join(SEO_BELGI_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
}

/**
 * Sitemap'ga belgi manzillarini qo'shadi.
 *
 * Sitemap'ni `generate-savol-pages.cjs` to'liq qayta yozadi, shuning
 * uchun bu skript UNDAN KEYIN ishlashi va faqat qo'shimcha qatorlarni
 * kiritishi shart.
 */
function appendToSitemap(signs) {
  let xml = fs.readFileSync(SITEMAP_PATH, "utf-8");
  if (xml.includes("/belgilar/")) {
    // Avvalgi ishlashdan qolgan qatorlar — qayta qo'shmaymiz.
    xml = xml.replace(/ {2}<url>\n {4}<loc>[^<]*\/belgilar\/[^<]*<\/loc>[\s\S]*?<\/url>\n/g, "");
  }

  const rows = signs
    .map(
      (s) =>
        `  <url>\n    <loc>${BASE_URL}/belgilar/${s.slug}</loc>\n` +
        `    <lastmod>${TODAY}</lastmod>\n    <changefreq>monthly</changefreq>\n` +
        `    <priority>0.7</priority>\n  </url>\n`,
    )
    .join("");

  fs.writeFileSync(SITEMAP_PATH, xml.replace("</urlset>", rows + "</urlset>"), "utf-8");
}

// ── Main ─────────────────────────────────────────────────────────────────────
const allSigns = loadSigns();
const published = loadPublishedQuestions();
const byCode = questionsBySignCode(published);

/* Faqat savoli bor belgilar — aks holda sahifa yupqa bo'lardi. */
const withQuestions = allSigns.filter(
  (s) => (byCode.get(s.code) || []).length >= MIN_QUESTIONS,
);

const byGroup = new Map();
for (const s of withQuestions) {
  if (!byGroup.has(s.groupTitle)) byGroup.set(s.groupTitle, []);
  byGroup.get(s.groupTitle).push(s);
}

for (const sign of withQuestions) {
  const questions = (byCode.get(sign.code) || []).slice(0, 15);
  const siblings = (byGroup.get(sign.groupTitle) || [])
    .filter((s) => s.slug !== sign.slug)
    .slice(0, 10);
  writePage(sign.slug, renderSignPage(sign, questions, siblings));
}

fs.writeFileSync(
  BELGI_INDEX_PATH,
  JSON.stringify({
    generatedAt: TODAY,
    total: allSigns.length,
    published: withQuestions.length,
    signs: withQuestions.map((s) => ({
      code: s.code,
      slug: s.slug,
      title: s.title,
      image: s.image,
      groupTitle: s.groupTitle,
    })),
  }),
  "utf-8",
);

appendToSitemap(withQuestions);

console.log(
  `✅ ${withQuestions.length} ta belgi sahifasi (jami belgilar: ${allSigns.length}, savolsizlari o'tkazib yuborildi)`,
);
console.log(`✅ Belgi indeksi: public/data/belgi-index.json`);
console.log(`✅ sitemap.xml ga belgi manzillari qo'shildi`);
