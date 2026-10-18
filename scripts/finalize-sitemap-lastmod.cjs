#!/usr/bin/env node
/**
 * Sitemap `<lastmod>` — haqiqiy mazmun o'zgargan sana (audit SEO-03).
 *
 * MUAMMO: generatorlar har buildda barcha ~420 manzilga BUGUNGI sanani
 * yozardi. Har deploy "hamma sahifa yangilandi" degan yolg'on signal edi —
 * Google bunday sitemap'da lastmod'ga ishonmay qo'yadi.
 *
 * YECHIM: har manzilning bot ko'radigan snapshoti (`public/_seo/<path>/index.html`)
 * xeshlanadi va `scripts/sitemap-lastmod.json` dagi oldingi xesh bilan
 * solishtiriladi. O'zgarmagan bo'lsa — eski sana, o'zgargan yoki yangi
 * bo'lsa — bugun. Snapshotlar deterministik (bir xil mazmun = bir xil fayl),
 * shuning uchun xesh ishonchli.
 *
 * `/ru/...` va `/cyr/...` alohida snapshotga ega emas — asosiy (lotin)
 * sahifaning sanasini oladi. Snapshoti yo'q manzil (masalan `/`) birinchi
 * ko'rilgan sanasida qoladi.
 *
 * Birinchi ishga tushishda sana snapshot faylining oxirgi git commit
 * sanasidan olinadi (bo'lmasa bugun). Manifest repoga commit qilinadi.
 *
 * `generate-savol-pages` va `generate-belgi-pages` sitemap'ni yozgandan
 * KEYIN ishlaydi (prebuild oxirida).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SITEMAP_PATH = path.join(ROOT, "public", "sitemap.xml");
const SEO_DIR = path.join(ROOT, "public", "_seo");
const MANIFEST_PATH = path.join(__dirname, "sitemap-lastmod.json");
const BASE_URL = "https://www.avtotestu.uz";
const TODAY = new Date().toISOString().slice(0, 10);

/** "/ru/belgilar" → "/belgilar", "/ru" → "/" */
function basePath(loc) {
  const p = loc.replace(BASE_URL, "") || "/";
  const m = p.match(/^\/(ru|cyr)(\/.*)?$/);
  return m ? m[2] || "/" : p;
}

function snapshotFile(base) {
  return base === "/"
    ? path.join(SEO_DIR, "index.html")
    : path.join(SEO_DIR, ...base.split("/").filter(Boolean), "index.html");
}

function gitDate(file) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch {
    return null;
  }
}

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function main() {
  const manifest = loadManifest();
  const xml = fs.readFileSync(SITEMAP_PATH, "utf-8");
  let changed = 0;
  let kept = 0;
  const seen = new Set();

  const resolveDate = (base) => {
    if (seen.has(base)) return manifest[base].d;
    seen.add(base);
    const file = snapshotFile(base);
    const hash = fs.existsSync(file)
      ? crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 16)
      : "no-snapshot";
    const prev = manifest[base];
    if (prev && prev.h === hash) {
      kept++;
      return prev.d;
    }
    const d = prev ? TODAY : (fs.existsSync(file) && gitDate(path.relative(ROOT, file))) || TODAY;
    manifest[base] = { h: hash, d };
    changed++;
    return d;
  };

  const out = xml.replace(/<url>([\s\S]*?)<\/url>/g, (block, inner) => {
    const loc = (inner.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    if (!loc) return block;
    const d = resolveDate(basePath(loc));
    return block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${d}</lastmod>`);
  });

  // Endi sitemap'da yo'q manzillar manifestdan olinadi (o'chirilgan savollar).
  for (const key of Object.keys(manifest)) {
    if (!seen.has(key)) delete manifest[key];
  }

  fs.writeFileSync(SITEMAP_PATH, out, "utf-8");
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  const next = JSON.stringify(sorted, null, 1) + "\n";
  const before = fs.existsSync(MANIFEST_PATH) ? fs.readFileSync(MANIFEST_PATH, "utf-8") : "";
  if (next !== before) fs.writeFileSync(MANIFEST_PATH, next, "utf-8");

  console.log(`🗓  Sitemap lastmod: ${kept} o'zgarmagan, ${changed} yangi/o'zgargan (${seen.size} sahifa)`);
}

main();
