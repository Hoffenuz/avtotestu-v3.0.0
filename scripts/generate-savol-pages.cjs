/**
 * Bepul savollardan Google uchun SEO snapshot yaratadi.
 * Chiqish: public/_seo/savol/{slug}/index.html
 *
 * MANBA — `free-uz-lat.json` (1009 ta BEPUL savol), `barcha` EMAS.
 * Sabab: PRO ning qiymati 251 ta maxsus savol va BARCHA izohlarda; ularni
 * Google ga ochish obunani ma'nosiz qilardi. Bu yerda chop etiladigan
 * narsa saytda allaqachon bepul — ya'ni yangi hech narsa oshkor bo'lmaydi.
 *
 * IZOH (`izoh`) HECH QACHON CHOP ETILMAYDI: u faqat savolni yo'l belgisiga
 * bog'lash uchun (kod qidirish) ichkarida ishlatiladi.
 *
 * BOSQICHLI: har safar `PHASE_LIMIT` ta savol. Google birdan paydo bo'lgan
 * minglab sahifani "sifatsiz massa" deb baholashi mumkin.
 *
 * MUHIM: public/savol/ ga YOZILMAYDI — aks holda CF Pages refreshda
 * React SPA o'rniga statik HTML beradi.
 *
 * Ishga tushirish: node scripts/generate-savol-pages.cjs
 */

const fs = require("fs");
const path = require("path");
const { signSlug, extractSignCodes } = require("./lib/seo-slug.cjs");

const ROOT = path.join(__dirname, "..");
const V59_PATH = path.join(ROOT, "public/data/variants/v59.json");
const FREE_PATH = path.join(ROOT, "public/free-uz-lat.json");
const ALL_PATH = path.join(ROOT, "public/barcha-uz-lat.json");
const SIGNS_PATH = path.join(ROOT, "public/data/belgilar.json");

/**
 * Katta indeks — BUNDLE'GA EMAS, `public/data` ga.
 * Bundle'ga qo'shilsa u HAR BIR foydalanuvchiga yuklanardi (1009 savol
 * ≈ 1.5 MB). Bu yerda esa faqat /savol/ sahifasi ochilganda so'raladi.
 */
const PUBLIC_INDEX_PATH = path.join(ROOT, "public/data/savol-index.json");

/** Shu bosqichda nechta savol chiqariladi. Keyingi bosqich: 600 -> 1009. */
const PHASE_LIMIT = 300;
const SEO_SAVOL_DIR = path.join(ROOT, "public/_seo/savol");
const LEGACY_SAVOL_DIR = path.join(ROOT, "public/savol");
const INDEX_PATH = path.join(ROOT, "src/data/savol-v59-index.json");
const SITEMAP_PATH = path.join(ROOT, "public/sitemap.xml");
const BASE_URL = "https://www.avtotestu.uz";
const BRAND = "AvtoSmart";
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

/**
 * Tushuntirish matni SHU YERDA YASALADI — bazadagi `izoh` EMAS.
 * Izoh PRO ning qiymati, u Google ga chiqarilmaydi.
 */
function buildExplanation(text, correctText, order, ticketNum) {
  const shortQ = text.length > 80 ? text.slice(0, 77) + "…" : text;
  const variantPart = ticketNum
    ? `Savol ${order}-sonli bo'lib, ${ticketNum}-sonli YHQ test variantiga kiradi. `
    : "";
  return (
    `Bu savolda to'g'ri javob: «${correctText}». ` +
    variantPart +
    `«${shortQ}» mavzusini mustahkamlash uchun AvtoSmart da onlayn test topshiring.`
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

/**
 * Yo'l belgilari: kod -> { slug, title }.
 * Savol sahifasidan belgi sahifasiga havola qo'yish uchun.
 */
function loadSignMap() {
  const map = new Map();
  try {
    const groups = JSON.parse(fs.readFileSync(SIGNS_PATH, "utf-8"));
    for (const g of groups) {
      for (const it of g.items) {
        if (!map.has(it.code)) {
          map.set(it.code, {
            code: it.code,
            title: it.title.uz_lat,
            slug: signSlug(it.code, it.title.uz_lat),
          });
        }
      }
    }
  } catch {
    /* belgilar fayli yo'q — havolasiz davom etamiz */
  }
  return map;
}

/**
 * Savol -> belgi kodlari. Kodlar IZOHDAN olinadi (`barcha` faylidan),
 * lekin izohning O'ZI hech qayerda chop etilmaydi.
 */
function loadSignCodesByQuestion(signCodes) {
  const byId = new Map();
  try {
    const all = JSON.parse(fs.readFileSync(ALL_PATH, "utf-8"));
    for (const item of all) {
      const izoh = item.izoh?.uz_lat || "";
      const codes = extractSignCodes(izoh, signCodes);
      if (codes.length) byId.set(item.task_info.global_id, codes);
    }
  } catch {
    /* manba yo'q — bog'lanishsiz davom etamiz */
  }
  return byId;
}

/**
 * Bepul savollar. Tartib `global_id` bo'yicha — BARQAROR bo'lishi shart:
 * aks holda keyingi bosqichda sluglar surilib, mavjud manzillar buzilardi.
 *
 * `seedSlugs` — allaqachon chiqarilgan savollarning slugi. Ular
 * O'ZGARMAYDI (indekslangan URL ni almashtirish SEO ni yo'qotadi).
 */
function parseFreeQuestions(seedSlugs) {
  const raw = JSON.parse(fs.readFileSync(FREE_PATH, "utf-8"));
  const signMap = loadSignMap();
  const signCodes = new Set(signMap.keys());
  const codesByQuestion = loadSignCodesByQuestion(signCodes);

  const sorted = [...raw].sort((a, b) =>
    String(a.task_info.global_id).localeCompare(String(b.task_info.global_id)),
  );

  const used = new Set(Object.values(seedSlugs || {}));
  return sorted.map((item) => {
    const globalId = item.task_info.global_id;
    const order = item.task_info.order;
    const ticketNum = item.task_info.ticket_num;
    const lang = item.content.uz_lat;
    const correct = lang.options.find((o) => o.is_correct);
    const fallbackSlug = String(globalId).replace(/_/g, "-");

    let slug = seedSlugs?.[globalId];
    if (!slug) {
      slug = slugify(lang.text, fallbackSlug);
      if (used.has(slug)) slug = `${slug}-${String(globalId).replace(/_/g, "-")}`;
    }
    used.add(slug);

    const signs = (codesByQuestion.get(globalId) || [])
      .map((c) => signMap.get(c))
      .filter(Boolean);

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
      correctText: correct?.text || "",
      explanation: buildExplanation(lang.text, correct?.text || "", order, ticketNum),
      imageUrl: resolveImageUrl(item.media_url),
      signs,
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

  /*
    Yonma-yon savollar — FAQAT o'sha variantdagilar va ko'pi bilan 12 ta.
    Avval butun ro'yxat berilardi: 300+ havolali sahifa Google nazarida
    "havola fermasi" ga o'xshab qoladi va har bir havolaning qiymati
    kamayadi.
  */
  const othersHtml = all
    .filter((x) => x.globalId !== q.globalId && x.ticketNum === q.ticketNum)
    .slice(0, 12)
    .map(
      (x) =>
        `<li><a href="${x.canonicalPath}">${x.order}. ${escapeHtml(x.text.slice(0, 55))}${x.text.length > 55 ? "…" : ""}</a></li>`
    )
    .join("\n          ");

  /*
    ICHKI HAVOLALAR: savol -> yo'l belgisi sahifasi.

    Bu FAQAT snapshot ichida (ya'ni botlar ko'radigan nusxada). Odam
    ko'radigan React sahifasiga tegilmaydi — dizayn o'zgarmaydi.
  */
  const signsHtml = (q.signs || []).length
    ? `<section class="related"><h2>Savolga tegishli yo'l belgilari</h2><ul>${q.signs
        .map(
          (sg) =>
            `<li><a href="/belgilar/${sg.slug}">${escapeHtml(sg.title)}</a></li>`,
        )
        .join("")}</ul></section>`
    : "";

  const imageBlock = q.imageUrl
    ? `<figure class="figure"><img src="${q.imageUrl}" alt="${escapeHtml(q.text)}" width="640" height="360" loading="lazy"><figcaption>Savol rasmi</figcaption></figure>`
    : "";

/*
    QAPage — sahifaning ASOSIY mazmuni bitta savol-javob ekanini bildiradi.
    Ilgari faqat `Question` berilardi: u sahifa turini emas, sahifadagi
    bitta obyektni tasvirlaydi. QAPage bilan Google javobni natijada
    to'g'ridan-to'g'ri ko'rsatishi mumkin.

    `upvoteCount` va `answerCount` — Google QAPage uchun talab qiladigan
    maydonlar; ularsiz sxema "to'liq emas" deb belgilanadi.
  */
  const schema = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: q.text,
      text: q.text,
      image: q.imageUrl || undefined,
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.correctText,
        upvoteCount: 1,
        url: canonical,
      },
      suggestedAnswer: q.options
        .filter((o) => !o.isCorrect)
        .map((o) => ({ "@type": "Answer", text: o.text, upvoteCount: 0 })),
    },
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
    ${signsHtml}
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

/**
 * "Yodlash kerak" bo'limidagi mavzular — manba fayldan O'QILADI.
 *
 * Ro'yxatni bu yerda takrorlash yaramaydi: mavzu qo'shilsa yoki id
 * o'zgarsa, sitemap jimgina eskirib qolardi.
 */
function yodlashTopicPaths() {
  try {
    const src = fs.readFileSync(path.join(ROOT, "src/lib/yodlashRaqamlari.ts"), "utf-8");
    return [...src.matchAll(/^\s{4}id:\s*"([a-z0-9-]+)",/gm)].map(
      (m) => `/yodlash-kerak/${m[1]}`,
    );
  } catch {
    return [];
  }
}

function updateSitemap(questions) {
  /**
   * DIQQAT: sitemap TO'LIQ shu yerda qayta yaratiladi va
   * `public/sitemap.xml` ustiga yoziladi. Ya'ni o'sha faylni qo'lda
   * tahrirlash BEHUDA — keyingi build o'chirib tashlaydi.
   * Yangi ochiq marshrut shu ro'yxatga qo'shilsin.
   */
  const mainUrls = [
    ["/", "daily", "1.0"],
    ["/test-ishlash", "daily", "0.95"],
    ["/real-imtihon", "weekly", "0.9"],
    ["/belgilar", "weekly", "0.9"],
    ["/variant", "weekly", "0.9"],
    ["/mavzuli", "weekly", "0.85"],
    ["/bolimlar", "weekly", "0.9"],
    ["/avtodrom", "monthly", "0.8"],
    ["/yodlash-kerak", "monthly", "0.8"],
    ...yodlashTopicPaths().map((p) => [p, "monthly", "0.7"]),
    ["/qidirish", "weekly", "0.6"],
    ["/qiyin-savollar", "weekly", "0.8"],
    ["/e-avtomaktab", "weekly", "0.85"],
    ["/e-avtomaktab-test", "weekly", "0.85"],
    ["/avtoimtihon-2026", "monthly", "0.8"],
    ["/darslik", "weekly", "0.8"],
    ["/qoshimcha", "monthly", "0.7"],
    ["/pro", "monthly", "0.75"],
    ["/contact", "monthly", "0.6"],
    ["/desktop", "monthly", "0.65"],
    ["/yangiliklar", "weekly", "0.75"],
    ["/savol/variant-59", "weekly", "0.85"],
  ];

  /*
    TIL VERSIYALARI

    Har bir asosiy sahifa uch manzilda mavjud:
      /belgilar        o'zbekcha (lotin)   — asosiy
      /cyr/belgilar    o'zbekcha (kirill)
      /ru/belgilar     ruscha

    Uchalasi ham alohida <url> sifatida beriladi va har biri `xhtml:link`
    orqali qolganlariga bog'lanadi. Bu Google ga "bir sahifaning uch
    varianti" deb aytadi — aks holda ular bir-birining nusxasi deb
    hisoblanardi va faqat bittasi indeksda qolardi.

    Savol sahifalari (/savol/...) faqat asosiy tilda: ular savol matnidan
    yasaladi va tarjima qilingan varianti yo'q.
  */
  const TILLAR = [
    { prefix: "", hreflang: "uz-Latn" },
    { prefix: "/cyr", hreflang: "uz-Cyrl" },
    { prefix: "/ru", hreflang: "ru" },
  ];

  /** `/` uchun prefiksli manzil `/ru` bo'ladi, `/ru/` emas. */
  const tilManzili = (prefix, loc) =>
    loc === "/" ? `${BASE_URL}${prefix || "/"}` : `${BASE_URL}${prefix}${loc}`;

  const alternates = (loc) => {
    const qatorlar = TILLAR.map(
      (t) => `    <xhtml:link rel="alternate" hreflang="${t.hreflang}" href="${tilManzili(t.prefix, loc)}"/>`,
    );
    qatorlar.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${tilManzili("", loc)}"/>`);
    return qatorlar.join("\n");
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  for (const [loc, freq, priority] of mainUrls) {
    for (const til of TILLAR) {
      xml += `  <url>\n    <loc>${tilManzili(til.prefix, loc)}</loc>\n${alternates(loc)}\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
    }
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

/*
  1-QADAM: variant 59 — MAVJUD oqim, o'zgarmaydi.
  Uning indeksi bundle'da qoladi (21 savol, ~30 KB) va hub sahifasini
  hamda /savol/variant-59 ro'yxatini ta'minlaydi.
*/
const raw = JSON.parse(fs.readFileSync(V59_PATH, "utf-8"));
const v59Questions = parseQuestions(raw);

fs.mkdirSync(path.dirname(INDEX_PATH), { recursive: true });
fs.writeFileSync(INDEX_PATH, JSON.stringify(buildIndex(v59Questions), null, 2), "utf-8");

/*
  2-QADAM: bepul savollar (bosqichli).

  Mavjud v59 sluglari SEED sifatida beriladi — ya'ni allaqachon
  indekslangan 21 ta manzil O'ZGARMAYDI.
*/
const seedSlugs = {};
for (const q of v59Questions) seedSlugs[q.globalId] = q.slug;

const freeAll = parseFreeQuestions(seedSlugs);

/*
  VARIANT 59 SAVOLLARI HAR DOIM RO'YXATDA — ular bepul to'plamda
  bo'lmasa ham.

  Sabab: bu 20 ta sahifa allaqachon jonli va Google tomonidan
  indekslangan. Ro'yxatdan chiqarish ularni 404 ga aylantirardi va
  mavjud SEO qiymatini yo'qotardi. Ya'ni bu YANGI oshkor qilish emas —
  bor holatni saqlash. Yangi PRO savollar esa qo'shilmaydi.
*/
const v59Ids = new Set(v59Questions.map((q) => q.globalId));
const freeIds = new Set(freeAll.map((q) => q.globalId));

/** v59 dagi, lekin bepul to'plamda yo'q savollar (avvaldan chiqarilgan). */
const legacyOnly = v59Questions
  .filter((q) => !freeIds.has(q.globalId))
  .map((q) => ({ ...q, signs: [] }));

const phase = [
  ...legacyOnly,
  ...freeAll.filter((q) => v59Ids.has(q.globalId)),
  ...freeAll.filter((q) => !v59Ids.has(q.globalId)),
].slice(0, Math.max(PHASE_LIMIT, v59Questions.length));

for (const q of phase) {
  const html = renderStaticPage(q, phase);
  writePage(q.slug, html);
  writePage(q.globalId, html.replace(
    `<link rel="canonical" href="${BASE_URL}${q.canonicalPath}">`,
    `<link rel="canonical" href="${BASE_URL}${q.canonicalPath}">\n  <link rel="alternate" href="${BASE_URL}${q.globalIdPath}">`
  ));
}

/*
  3-QADAM: ommaviy indeks — /savol/{slug} ni ODAM ochganda React shu
  fayldan savolni topadi. Bundle'ga KIRMAYDI, faqat o'sha sahifada
  so'raladi.
*/
const publicIndex = {
  generatedAt: TODAY,
  phaseLimit: PHASE_LIMIT,
  total: freeAll.length,
  published: phase.length,
  questions: phase.map((q) => ({
    globalId: q.globalId,
    slug: q.slug,
    order: q.order,
    ticketNum: q.ticketNum,
    text: q.text,
    options: q.options,
    correctId: q.correctId,
    correctText: q.correctText,
    explanation: q.explanation,
    imageUrl: q.imageUrl,
    signs: q.signs,
    topicLabel: q.topicLabel,
    topicLink: q.topicLink,
    canonicalPath: q.canonicalPath,
    globalIdPath: q.globalIdPath,
  })),
};
fs.mkdirSync(path.dirname(PUBLIC_INDEX_PATH), { recursive: true });
fs.writeFileSync(PUBLIC_INDEX_PATH, JSON.stringify(publicIndex), "utf-8");

writePage(`variant-${v59Questions[0].ticketNum}`, renderHubPage(v59Questions));
updateSitemap(phase);
removeLegacySavolShadows();

console.log(`✅ ${phase.length} ta savol SEO sahifasi (jami bepul: ${freeAll.length}, bosqich: ${PHASE_LIMIT})`);
console.log(`✅ Bundle indeksi (v59): src/data/savol-v59-index.json`);
console.log(`✅ Ommaviy indeks: public/data/savol-index.json`);
console.log(`✅ Hub snapshot: /_seo/savol/variant-${v59Questions[0].ticketNum}`);
console.log(`✅ sitemap.xml yangilandi`);
