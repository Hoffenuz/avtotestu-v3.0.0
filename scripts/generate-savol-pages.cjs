/**
 * v59.json savollaridan Google uchun SEO snapshot yaratadi.
 * Chiqish: public/_seo/savol/{slug}/index.html
 *
 * MUHIM: public/savol/ ga YOZILMAYDI — aks holda CF Pages refreshda
 * React SPA o'rniga statik HTML beradi.
 *
 * Ishga tushirish: node scripts/generate-savol-pages.cjs
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const V59_PATH = path.join(ROOT, "public/data/variants/v59.json");
const SEO_SAVOL_DIR = path.join(ROOT, "public/_seo/savol");
const LEGACY_SAVOL_DIR = path.join(ROOT, "public/savol");
const INDEX_PATH = path.join(ROOT, "src/data/savol-v59-index.json");
const SITEMAP_PATH = path.join(ROOT, "public/sitemap.xml");
const BASE_URL = "https://www.avtotestu.uz";
const BRAND = "Avtotestlar.uz";
const TODAY = new Date().toISOString().slice(0, 10);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(text, fallback) {
  let s = text
    .toLowerCase()
    .replace(/o[''`ʻʼ]/g, "o")
    .replace(/g[''`ʻʼ]/g, "g")
    .replace(/[''`ʻʼ«»""]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);

  if (!s || s.length < 8) return fallback;
  return s;
}

function resolveImageUrl(mediaUrl) {
  if (!mediaUrl?.trim()) return null;
  if (mediaUrl.startsWith("http")) return mediaUrl;
  const file = mediaUrl.replace(/^\//, "");
  return `${BASE_URL}/images/${file}`;
}

function buildExplanation(text, correctText, order) {
  const shortQ = text.length > 80 ? text.slice(0, 77) + "…" : text;
  return (
    `Bu savolda to'g'ri javob: «${correctText}». ` +
    `Savol ${order}-sonli bo'lib, 59-sonli YHQ test variantiga kiradi. ` +
    `«${shortQ}» mavzusini mustahkamlash uchun Avtotestlar.uz da onlayn test topshiring.`
  );
}

function optionLabel(id) {
  return ["A", "B", "C", "D", "E"][id - 1] || String(id);
}

function parseQuestions(raw) {
  const usedSlugs = new Set();
  return raw.map((item) => {
    const globalId = item.task_info.global_id;
    const order = item.task_info.order;
    const ticketNum = item.task_info.ticket_num;
    const lang = item.content.uz_lat;
    const correct = lang.options.find((o) => o.is_correct);
    const fallbackSlug = globalId.replace(/_/g, "-");

    let slug = slugify(lang.text, fallbackSlug);
    if (usedSlugs.has(slug)) slug = `${slug}-${order}`;
    usedSlugs.add(slug);

    const imageUrl = resolveImageUrl(item.media_url);
    const correctText = correct?.text || "";
    const explanation = buildExplanation(lang.text, correctText, order);

    return {
      globalId,
      slug,
      order,
      ticketNum,
      text: lang.text,
      options: lang.options.map((o) => ({
        id: o.id,
        label: optionLabel(o.id),
        text: o.text,
        isCorrect: o.is_correct,
      })),
      correctId: correct?.id ?? 1,
      correctText,
      explanation,
      imageUrl,
      topicLabel: `${ticketNum}-sonli test varianti`,
      topicLink: "/variant",
      canonicalPath: `/savol/${slug}`,
      globalIdPath: `/savol/${globalId}`,
    };
  });
}

function relatedLinks(all, current) {
  const idx = all.findIndex((q) => q.globalId === current.globalId);
  const links = [];
  if (idx > 0) {
    const prev = all[idx - 1];
    links.push({ href: prev.canonicalPath, label: `← ${prev.order}-savol` });
  }
  if (idx < all.length - 1) {
    const next = all[idx + 1];
    links.push({ href: next.canonicalPath, label: `${next.order}-savol →` });
  }
  return links;
}

function renderStaticPage(q, all) {
  const canonical = `${BASE_URL}${q.canonicalPath}`;
  const title = `${q.text.slice(0, 60)}${q.text.length > 60 ? "…" : ""} | ${BRAND}`;
  const description = `${q.text.slice(0, 140)}${q.text.length > 140 ? "…" : ""} To'g'ri javob va tushuntirish.`;
  const rel = relatedLinks(all, q);

  const optionsHtml = q.options
    .map(
      (o) =>
        `<li class="${o.isCorrect ? "correct" : ""}"><strong>${o.label}.</strong> ${escapeHtml(o.text)}${o.isCorrect ? " <span class=\"badge\">To'g'ri</span>" : ""}</li>`
    )
    .join("\n        ");

  const relHtml = rel
    .map((l) => `<a href="${l.href}">${escapeHtml(l.label)}</a>`)
    .join(" · ");

  const othersHtml = all
    .filter((x) => x.globalId !== q.globalId)
    .map(
      (x) =>
        `<li><a href="${x.canonicalPath}">${x.order}. ${escapeHtml(x.text.slice(0, 55))}${x.text.length > 55 ? "…" : ""}</a></li>`
    )
    .join("\n          ");

  const imageBlock = q.imageUrl
    ? `<figure class="figure"><img src="${q.imageUrl}" alt="${escapeHtml(q.text)}" width="640" height="360" loading="lazy"><figcaption>Savol rasmi</figcaption></figure>`
    : "";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Question",
    name: q.text,
    text: q.text,
    image: q.imageUrl || undefined,
    acceptedAnswer: {
      "@type": "Answer",
      text: q.correctText,
    },
    suggestedAnswer: q.options.map((o) => ({
      "@type": "Answer",
      text: o.text,
    })),
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
  <meta property="og:site_name" content="${BRAND}">
  ${q.imageUrl ? `<meta property="og:image" content="${q.imageUrl}">` : ""}
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.65; color: #1a202c; background: #f7fafc; }
    .wrap { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
    .nav { margin-bottom: 20px; font-size: 14px; }
    .nav a { color: #1E2350; text-decoration: none; margin-right: 12px; }
    .nav a:hover { text-decoration: underline; }
    h1 { font-size: 1.45rem; color: #1E2350; margin-bottom: 16px; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
    .figure { margin: 20px 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .figure img { display: block; width: 100%; height: auto; }
    .figure figcaption { padding: 8px 12px; font-size: 12px; color: #64748b; }
    .options { list-style: none; margin: 20px 0; }
    .options li { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; }
    .options li.correct { border-color: #22c55e; background: #f0fdf4; }
    .badge { font-size: 11px; font-weight: 700; color: #15803d; text-transform: uppercase; }
    .answer-box, .explain-box { background: #fff; border-radius: 12px; padding: 16px; margin: 16px 0; border: 1px solid #e2e8f0; }
    .answer-box h2, .explain-box h2, .related h2 { font-size: 1rem; color: #1E2350; margin-bottom: 8px; }
    .topic { display: inline-block; margin-top: 8px; padding: 8px 14px; background: #1E2350; color: #fff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; }
    .topic:hover { background: #2d3568; }
    .rel-nav { margin: 20px 0; font-size: 14px; }
    .rel-nav a { color: #1E2350; font-weight: 600; }
    .related ul { list-style: none; columns: 1; gap: 8px; }
    .related li { margin-bottom: 6px; font-size: 14px; }
    .related a { color: #1E2350; text-decoration: none; }
    .related a:hover { text-decoration: underline; }
    footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center; }
    .cta { display: inline-block; margin-top: 12px; padding: 10px 18px; background: #eab308; color: #1E2350; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
  </style>
</head>
<body>
  <div class="wrap">
    <nav class="nav">
      <a href="/">Bosh sahifa</a>
      <a href="/test-ishlash">Test ishlash</a>
      <a href="/variant">Variantlar</a>
      <a href="/belgilar">Yo'l belgilari</a>
    </nav>
    <p class="meta">YHQ savoli · Variant ${q.ticketNum} · ${q.order}/20</p>
    <h1>${escapeHtml(q.text)}</h1>
    ${imageBlock}
    <ol class="options">
        ${optionsHtml}
    </ol>
    <div class="answer-box">
      <h2>To'g'ri javob</h2>
      <p><strong>${optionLabel(q.correctId)}.</strong> ${escapeHtml(q.correctText)}</p>
    </div>
    <div class="explain-box">
      <h2>Tushuntirish</h2>
      <p>${escapeHtml(q.explanation)}</p>
      <a class="topic" href="${q.topicLink}">📘 ${escapeHtml(q.topicLabel)}</a>
    </div>
    ${rel.length ? `<div class="rel-nav">${relHtml}</div>` : ""}
    <section class="related">
      <h2>Variant ${q.ticketNum} — boshqa savollar</h2>
      <ul>
          ${othersHtml}
      </ul>
      <a class="cta" href="/test-ishlash">Onlayn test topshirish</a>
    </section>
    <footer>© ${new Date().getFullYear()} ${BRAND} — Haydovchilik guvohnomasi uchun YHQ testlari</footer>
  </div>
</body>
</html>`;
}

function writePage(subpath, html) {
  const dir = path.join(SEO_SAVOL_DIR, subpath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
}

/** Eski shadow papkani tozalash — SPA route ni bloklamasligi uchun */
function removeLegacySavolShadows() {
  if (!fs.existsSync(LEGACY_SAVOL_DIR)) return;
  const rm = (p) => {
    if (!fs.existsSync(p)) return;
    for (const name of fs.readdirSync(p)) {
      const full = path.join(p, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) rm(full);
      else fs.unlinkSync(full);
    }
    fs.rmdirSync(p);
  };
  rm(LEGACY_SAVOL_DIR);
  console.log("🗑️  removed public/savol/ (SPA shadow)");
}

function buildIndex(questions) {
  const bySlug = {};
  const byGlobalId = {};
  for (const q of questions) {
    bySlug[q.slug] = q.globalId;
    byGlobalId[q.globalId] = q.slug;
  }
  return { generatedAt: TODAY, variant: 59, questions, bySlug, byGlobalId };
}

function updateSitemap(questions) {
  const mainUrls = [
    ["/", "daily", "1.0"],
    ["/test-ishlash", "daily", "0.95"],
    ["/belgilar", "weekly", "0.9"],
    ["/variant", "weekly", "0.9"],
    ["/mavzuli", "weekly", "0.85"],
    ["/darslik", "weekly", "0.8"],
    ["/qoshimcha", "monthly", "0.7"],
    ["/pro", "monthly", "0.75"],
    ["/contact", "monthly", "0.6"],
    ["/desktop", "monthly", "0.65"],
    ["/yangiliklar", "weekly", "0.75"],
    [`/savol/variant-${questions[0].ticketNum}`, "weekly", "0.85"],
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const [loc, freq, priority] of mainUrls) {
    xml += `  <url>\n    <loc>${BASE_URL}${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
  }

  for (const q of questions) {
    xml += `  <url>\n    <loc>${BASE_URL}${q.canonicalPath}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  }

  xml += `</urlset>\n`;
  fs.writeFileSync(SITEMAP_PATH, xml, "utf-8");
}

function renderHubPage(questions) {
  const ticketNum = questions[0].ticketNum;
  const canonical = `${BASE_URL}/savol/variant-${ticketNum}`;
  const list = questions
    .map(
      (q) =>
        `<li><a href="${q.canonicalPath}">${q.order}. ${escapeHtml(q.text)}</a>${q.imageUrl ? " 🖼" : ""}</li>`
    )
    .join("\n        ");

  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Variant ${ticketNum} — 20 ta YHQ savoli | ${BRAND}</title>
  <meta name="description" content="YHQ test varianti ${ticketNum}: 20 ta savol, rasmlar va to'g'ri javoblar bilan. Haydovchilik guvohnomasi imtihoniga tayyorgarlik.">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow">
</head>
<body style="font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:24px 16px;line-height:1.6;color:#1a202c">
  <nav style="margin-bottom:16px;font-size:14px"><a href="/">Bosh sahifa</a> · <a href="/variant">Variantlar</a></nav>
  <h1 style="color:#1E2350">Variant ${ticketNum} — barcha savollar</h1>
  <p>20 ta YHQ savoli to'g'ri javob va tushuntirish bilan.</p>
  <ul style="padding-left:20px">
        ${list}
  </ul>
  <p style="margin-top:24px"><a href="/test-ishlash" style="background:#eab308;color:#1E2350;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">Onlayn test topshirish</a></p>
</body>
</html>`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const raw = JSON.parse(fs.readFileSync(V59_PATH, "utf-8"));
const questions = parseQuestions(raw);

fs.mkdirSync(path.dirname(INDEX_PATH), { recursive: true });
fs.writeFileSync(INDEX_PATH, JSON.stringify(buildIndex(questions), null, 2), "utf-8");

for (const q of questions) {
  const html = renderStaticPage(q, questions);
  writePage(q.slug, html);
  writePage(q.globalId, html.replace(
    `<link rel="canonical" href="${BASE_URL}${q.canonicalPath}">`,
    `<link rel="canonical" href="${BASE_URL}${q.canonicalPath}">\n  <link rel="alternate" href="${BASE_URL}${q.globalIdPath}">`
  ));
}

writePage(`variant-${questions[0].ticketNum}`, renderHubPage(questions));
updateSitemap(questions);
removeLegacySavolShadows();

console.log(`✅ ${questions.length} ta savol SEO sahifasi: /_seo/savol/ (slug + global_id)`);
console.log(`✅ Index: src/data/savol-v59-index.json`);
console.log(`✅ Hub snapshot: /_seo/savol/variant-${questions[0].ticketNum}`);
console.log(`✅ sitemap.xml yangilandi`);
