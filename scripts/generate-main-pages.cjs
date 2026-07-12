/**
 * Asosiy sahifalar uchun statik HTML (Google botlari uchun).
 * public/static/*.html → public/{route}/index.html
 * Ishga tushirish: node scripts/generate-main-pages.cjs
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const STATIC_SRC = path.join(ROOT, "public/static");
const PUBLIC = path.join(ROOT, "public");
const INDEX_HTML = path.join(ROOT, "index.html");
const BASE_URL = "https://www.avtotestu.uz";
const BRAND = "Avtotestlar.uz";

const ROUTE_MAP = {
  "test-ishlash.html": "test-ishlash",
  "belgilar.html": "belgilar",
  "variant.html": "variant",
  "mavzuli.html": "mavzuli",
  "darslik.html": "darslik",
  "qoshimcha.html": "qoshimcha",
  "pro.html": "pro",
  "contact.html": "contact",
};

function applyContentFixes(html) {
  return html
    .replace(/40\+ test varianti/gi, "62 ta test varianti")
    .replace(/40\+ Variant/gi, "62 ta Variant")
    .replace(/40\+ variant/gi, "62 ta variant")
    .replace(/40 ta variant/gi, "62 ta variant")
    .replace(/Barcha 40\+ variant/gi, "Barcha 62 ta variant")
    .replace(/"numberOfItems": 300/g, '"numberOfItems": 269')
    .replace(/700\+ savol/g, "600+ bepul savol")
    .replace(/700 ta umumiy savollar/gi, "600+ ta bepul savollar")
    .replace(/61 variant/gi, "62 ta variant")
    .replace(/61 ta to'liq variant/gi, "62 ta to'liq variant")
    .replace(/Avtotestu/g, "Avtotestlar.uz")
    .replace(/og:site_name" content="Avtotestlar"/g, `og:site_name" content="${BRAND}"`);
}

function copyRoutePages() {
  for (const [file, route] of Object.entries(ROUTE_MAP)) {
    const src = path.join(STATIC_SRC, file);
    if (!fs.existsSync(src)) {
      console.warn(`⚠️  Skip missing: ${file}`);
      continue;
    }
    let html = applyContentFixes(fs.readFileSync(src, "utf-8"));
    const outDir = path.join(PUBLIC, route);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
    console.log(`✅ /${route}/index.html`);
  }
}

function writeDesktopPage() {
  const html = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Desktop ilova | ${BRAND} — Offline test</title>
  <meta name="description" content="Avtotestlar.uz Windows desktop ilovasini yuklab oling. Internetsiz YHQ testlari, katta ekranda qulay o'rganish va tez mahalliy ilova. Haydovchilik guvohnomasi imtihoniga tayyorlaning.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE_URL}/desktop">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE_URL}/desktop">
  <meta property="og:title" content="Desktop ilova | ${BRAND}">
  <meta property="og:description" content="Windows uchun offline YHQ test ilovasi. Internet bo'lmasa ham test ishlang.">
  <meta property="og:site_name" content="${BRAND}">
  <meta property="og:image" content="${BASE_URL}/rasm1.webp">
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.65; color: #1a202c; background: #f7fafc; margin: 0; }
    .wrap { max-width: 760px; margin: 0 auto; padding: 32px 16px 48px; }
  </style>
</head>
<body>
  <div class="wrap">
    <nav style="margin-bottom:20px;font-size:14px"><a href="/">Bosh sahifa</a> · <a href="/test-ishlash">Test ishlash</a></nav>
    <h1 style="color:#1E2350">Avtotestlar Desktop ilova</h1>
    <p>Windows kompyuter uchun mahalliy ilova. Internet bo'lmasa ham YHQ testlarini ishlang, katta ekranda qulay o'rganing.</p>
    <h2 style="color:#1E2350;font-size:1.1rem;margin-top:24px">Afzalliklar</h2>
    <ul>
      <li>Internet bo'lmasa ham test ishlang</li>
      <li>Katta ekranda qulay interfeys</li>
      <li>Tez va barqaror mahalliy ilova</li>
      <li>1200+ savollar bazasi (PRO litsenziya bilan)</li>
    </ul>
    <p style="margin-top:24px"><a href="/desktop" style="background:#1E2350;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Ilovani yuklab olish</a></p>
    <p style="margin-top:16px;font-size:14px;color:#64748b">Mobil qurilmada bu sahifadan yuklab olish mumkin emas — kompyuter yoki noutbukdan kiring.</p>
  </div>
</body>
</html>`;
  const outDir = path.join(PUBLIC, "desktop");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
  console.log("✅ /desktop/index.html");
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
            <h1>Avtotestlar.uz — Haydovchilik guvohnomasi uchun YHQ testlari</h1>
            <p style="margin-top:8px;opacity:.9">2026 yil yangilangan savollar, yo'l belgilari va onlayn testlar</p>
          </header>
          ${simplified}
          <footer style="padding:20px;background:#f7fafc;text-align:center;margin-top:32px">
            <p>© ${new Date().getFullYear()} Avtotestlar.uz — O'zbekistonda haydovchilik guvohnomasi uchun YHQ testlari</p>
          </footer>
        </div>
      </noscript>`;

  let indexHtml = fs.readFileSync(INDEX_HTML, "utf-8");
  indexHtml = indexHtml.replace(/<noscript>[\s\S]*?<\/noscript>/, noscriptBlock);
  fs.writeFileSync(INDEX_HTML, indexHtml, "utf-8");
  console.log("✅ index.html noscript yangilandi");
}

console.log("🔧 Asosiy sahifalar statik HTML yaratilmoqda...\n");
copyRoutePages();
writeDesktopPage();
patchHomeNoscript();
console.log("\n✨ Tayyor!");
