/**
 * Build guard: SPA route papkalarida index.html bo'lmasligi shart.
 * CF Pages mavjud faylni /* /index.html 200 dan OLDIN beradi —
 * shuning uchun public/mavzuli/index.html refreshda Reactni o'ldiradi.
 *
 * SEO snapshot faqat public/_seo/ ostida bo'lishi kerak.
 *
 * Usage:
 *   node scripts/assert-no-spa-shadow.cjs           # faqat tekshir
 *   node scripts/assert-no-spa-shadow.cjs --fix     # dist dagi shadowlarni o'chirib tekshir
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");
const FIX = process.argv.includes("--fix");

const SPA_ROOTS = [
  "test-ishlash",
  "belgilar",
  "variant",
  "mavzuli",
  "darslik",
  "qoshimcha",
  "pro",
  "contact",
  "desktop",
  "yangiliklar",
  "profile",
  "auth",
  "savol",
];

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function rmFile(p) {
  try {
    fs.unlinkSync(p);
    return true;
  } catch {
    return false;
  }
}

function rmDirIfEmpty(dir) {
  try {
    if (!exists(dir)) return;
    if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  } catch {
    /* ignore */
  }
}

/** dist ichidagi SPA shadow HTML ni o'chirish (eski build qoldiqlari) */
function cleanDistShadows() {
  if (!exists(DIST)) return 0;
  let n = 0;

  for (const route of SPA_ROOTS) {
    if (route === "savol") continue;
    const shadow = path.join(DIST, route, "index.html");
    if (exists(shadow) && rmFile(shadow)) {
      console.log(`🗑️  removed dist/${route}/index.html`);
      n++;
      rmDirIfEmpty(path.join(DIST, route));
    }
  }

  const savolDir = path.join(DIST, "savol");
  if (exists(savolDir)) {
    try {
      fs.rmSync(savolDir, { recursive: true, force: true });
      console.log("🗑️  removed dist/savol/");
      n++;
    } catch {
      /* ignore */
    }
  }

  // Eski build qoldig'i: shablon papkasi endi scripts/seo-templates/ da —
  // dist/static/ bo'lsa, real userlar SPA'siz xom HTML ochadi.
  const staticDir = path.join(DIST, "static");
  if (exists(staticDir)) {
    try {
      fs.rmSync(staticDir, { recursive: true, force: true });
      console.log("🗑️  removed dist/static/ (eski shablon qoldig'i)");
      n++;
    } catch {
      /* ignore */
    }
  }

  // Eski build qoldig'i: HTTrack ko'chirma endi scripts/data-sources/ da.
  const belgilarStray = path.join(DIST, "belgilar", "belgilar.html");
  if (exists(belgilarStray) && rmFile(belgilarStray)) {
    console.log("🗑️  removed dist/belgilar/belgilar.html (eski ko'chirma qoldig'i)");
    n++;
  }

  return n;
}

/**
 * public/static/ eski shablon joyi — endi scripts/seo-templates/ da.
 * Agar qayta paydo bo'lsa, dist ga xom HTML tarqaladi va real
 * userlar /static/*.html ni to'g'ridan-to'g'ri (SPA'siz) ochib qoladi.
 */
function collectStaticTemplateLeak(baseDir, label) {
  const errors = [];
  const staticDir = path.join(baseDir, "static");
  if (!exists(staticDir)) return errors;
  errors.push(
    `${label}/static/ topildi — bu shablon papka public/ ichida bo'lmasligi kerak ` +
      `(real userlar /static/*.html ni SPA'siz ochadi). scripts/seo-templates/ ga ko'chiring.`,
  );
  return errors;
}

/**
 * Google/Yandex saytga tasdiqlash fayllari kabi bitta-fayl root
 * verifikatsiyalarga ruxsat — qolgan har qanday .html public/ ichida
 * (public/_seo/ dan tashqari) xato hisoblanadi. Masalan
 * public/belgilar/belgilar.html — HTTrack orqali ko'chirilgan boshqa
 * saytning ko'chirmasi edi va /belgilar/belgilar.html da SPA'siz
 * to'g'ridan-to'g'ri userlarga xizmat qilib turgan edi.
 */
const ROOT_VERIFICATION_HTML = /^(google|yandex_|baidu_verify_)[a-z0-9]+\.html$/i;

function collectStrayHtmlLeak(baseDir, label) {
  const errors = [];
  if (!exists(baseDir)) return errors;

  const walk = (dir, rel) => {
    for (const name of fs.readdirSync(dir)) {
      if (name === "_seo") continue;
      const full = path.join(dir, name);
      const r = rel ? `${rel}/${name}` : name;
      let st;
      try {
        st = fs.statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walk(full, r);
      } else if (name.toLowerCase().endsWith(".html")) {
        if (!rel && name === "index.html") continue; // SPA entry (dist/index.html)
        if (!rel && ROOT_VERIFICATION_HTML.test(name)) continue; // root-level site verification file
        errors.push(
          `${label}/${r} — public/ ichida chetdagi .html (faqat public/_seo/ ruxsat; ` +
            `bu fayl real foydalanuvchilarga SPA'siz to'g'ridan-to'g'ri ochiladi)`,
        );
      }
    }
  };
  walk(baseDir, "");
  return errors;
}

function collectErrors(baseDir, label) {
  const errors = [
    ...collectStaticTemplateLeak(baseDir, label),
    ...collectStrayHtmlLeak(baseDir, label),
  ];
  if (!exists(baseDir)) return errors;

  for (const route of SPA_ROOTS) {
    const shadow = path.join(baseDir, route, "index.html");
    if (exists(shadow)) {
      errors.push(
        `${label}/${route}/index.html — SPA ni shadow qiladi (o'chiring yoki /_seo/ ga ko'chiring)`,
      );
    }
  }

  const savolDir = path.join(baseDir, "savol");
  if (exists(savolDir)) {
    const walk = (dir, rel) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const r = rel ? `${rel}/${name}` : name;
        if (fs.statSync(full).isDirectory()) walk(full, r);
        else if (name === "index.html") {
          errors.push(
            `${label}/savol/${r} — SPA shadow (faqat _seo/savol/ ruxsat)`,
          );
        }
      }
    };
    walk(savolDir, "");
  }

  return errors;
}

if (FIX) {
  const removed = cleanDistShadows();
  if (removed) console.log(`✅ dist shadow tozalandi`);
}

const errors = [
  ...collectErrors(PUBLIC, "public"),
  ...collectErrors(DIST, "dist"),
];

if (errors.length) {
  console.error("\n❌ SPA shadow HTML topildi — build bekor:\n");
  for (const e of errors) console.error(`  • ${e}`);
  console.error(
    "\nQoida: foydalanuvchi URL ( /mavzuli , /savol/... ) da index.html bo'lmasin.\n" +
      "SEO uchun faqat public/_seo/... ishlating.\n" +
      "Eski dist uchun: node scripts/assert-no-spa-shadow.cjs --fix\n",
  );
  process.exit(1);
}

console.log(
  "✅ SPA shadow tekshiruvi: OK (public" + (exists(DIST) ? " + dist" : "") + ")",
);
