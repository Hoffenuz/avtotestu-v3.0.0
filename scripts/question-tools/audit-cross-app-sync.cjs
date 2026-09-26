#!/usr/bin/env node
// ============================================================================
// audit-cross-app-sync.cjs — saytning savollar bazasini (public/) ilovalardagi
// nusxalar bilan solishtiradi. FAQAT O'QIYDI, hech bir faylni o'zgartirmaydi.
//
//   node scripts/question-tools/audit-cross-app-sync.cjs
//   node scripts/question-tools/audit-cross-app-sync.cjs --mobile <dir> --desktop <dir> --no-report
//
// Yagona manba: public/barcha.json (uch tilli, har savol task_info.global_id bilan).
// Nusxalar (standart yo'llar sayt papkasiga nisbatan, env yoki flag bilan almashtiriladi):
//   mobil     ../projects/lar/avtotest_app/assets/tests-json   (AVTOSMART_MOBILE_DATA)
//   kompyuter ../projects/desktop-ilova/public                  (AVTOSMART_DESKTOP_PUBLIC)
//   Telegram bot — supabase/functions ichida savol nusxasi yo'qligi tekshiriladi.
//
// Har farq ikki turga ajratiladi:
//   mazmun — foydalanuvchi boshqa narsani ko'radi (matn, javob, izoh, rasm);
//   format — faqat tipografiya: bo'shliqlar, CRLF, ‘ ’ ʻ ' , « » " , — – -.
// Chiqish kodi 1 — mazmun farqi yoki tuzilma xatosi bor; format farqi kodni o'zgartirmaydi.
// Hisobot: konsol + reports/sync-YYYY-MM-DD.md (sana Toshkent vaqti bo'yicha).
// ============================================================================

const fs = require('fs');
const path = require('path');
const { contentHash } = require('./generate-questions-version.cjs');

const LANGS = ['uz_lat', 'uz_cyr', 'ru'];
const projectRoot = path.resolve(__dirname, '..', '..');
const SITE = path.join(projectRoot, 'public');

function parseArgs(argv) {
  const out = { report: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mobile') out.mobile = argv[++i];
    else if (a === '--desktop') out.desktop = argv[++i];
    else if (a === '--no-report') out.report = false;
    else if (a === '--help' || a === '-h') {
      console.log('node scripts/question-tools/audit-cross-app-sync.cjs [--mobile DIR] [--desktop DIR] [--no-report]');
      process.exit(0);
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const MOBILE = path.resolve(args.mobile || process.env.AVTOSMART_MOBILE_DATA
  || path.join(projectRoot, '..', 'projects', 'lar', 'avtotest_app', 'assets', 'tests-json'));
const DESKTOP = path.resolve(args.desktop || process.env.AVTOSMART_DESKTOP_PUBLIC
  || path.join(projectRoot, '..', 'projects', 'desktop-ilova', 'public'));

// ── yordamchilar ────────────────────────────────────────────────────────────

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
}

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function listJson(dir) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json'));
}

function fileNum(name) {
  const m = name.match(/\d+/);
  return m ? Number(m[0]) : Number.NaN;
}

function byNumber(a, b) {
  return fileNum(a) - fileNum(b) || a.localeCompare(b);
}

function isQuestion(o) {
  return !!(o && typeof o === 'object' && o.task_info && o.task_info.global_id && o.content);
}

function questionsOf(data) {
  if (!Array.isArray(data)) return [];
  return data.filter(isQuestion);
}

/** Variant/mavzu fayli ID ro'yxati bo'lishi (mobil) yoki to'liq savollar (sayt, kompyuter) — ikkalasi ham. */
function idsOf(data) {
  if (!Array.isArray(data)) return [];
  return data.map((x) => (typeof x === 'string' ? x : x && x.task_info && x.task_info.global_id)).filter(Boolean);
}

/** Tipografik farqlarni yo'qotadi — shu bilan teng bo'lsa, farq "format". */
function normText(s) {
  return String(s ?? '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[‘’ʻʼ`´]/g, "'")
    .replace(/[“”„«»]/g, '"')
    .replace(/[‒–—―−]/g, '-')
    .replace(/[   ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cmpText(a, b) {
  const x = String(a ?? '');
  const y = String(b ?? '');
  if (x === y) return null;
  return normText(x) === normText(y) ? 'format' : 'content';
}

function mediaName(m) {
  const t = String(m ?? '').trim();
  if (!t) return '';
  if (/^https?:/i.test(t)) return t;
  return path.posix.basename(t.replace(/\\/g, '/'));
}

function correctIdx(options) {
  return (options || []).map((o, i) => (o && o.is_correct ? i + 1 : 0)).filter(Boolean).join(',');
}

function short(v, n = 160) {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function tashkentDate() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tashkent' });
}

// ── savolni solishtirish ────────────────────────────────────────────────────

/**
 * Nusxadagi savolni saytdagisi bilan solishtiradi. Faqat nusxada BOR tillar
 * tekshiriladi (barcha-uz-lat.json faqat uz_lat saqlaydi). Izohsiz fayllar
 * (free-*.json — bepul bazada izoh yo'q) izoh bo'yicha tekshirilmaydi.
 */
function compareQuestion(site, copy) {
  const diffs = [];
  const add = (lang, field, kind, s, c) => diffs.push({ lang, field, kind, site: s, copy: c });

  const sm = mediaName(site.media_url);
  const cm = mediaName(copy.media_url);
  if (sm !== cm) add(null, 'media_url', 'content', sm || '(rasm yo‘q)', cm || '(rasm yo‘q)');
  else if (String(site.media_url ?? '') !== String(copy.media_url ?? '')) add(null, 'media_url', 'format', site.media_url, copy.media_url);

  const copyLangs = LANGS.filter((l) => copy.content && copy.content[l]);
  if (copyLangs.length > 1) {
    for (const l of LANGS) {
      if (site.content?.[l] && !copy.content?.[l]) add(l, 'til', 'content', 'bor', 'yo‘q');
    }
  }

  for (const l of copyLangs) {
    const s = site.content?.[l];
    const c = copy.content[l];
    if (!s) { add(l, 'til', 'content', 'yo‘q', 'bor'); continue; }

    const t = cmpText(s.text, c.text);
    if (t) add(l, 'savol matni', t, s.text, c.text);

    const so = s.options || [];
    const co = c.options || [];
    if (so.length !== co.length) {
      add(l, 'variantlar soni', 'content', so.length, co.length);
    } else {
      so.forEach((o, i) => {
        const k = cmpText(o.text, co[i].text);
        if (k) add(l, `${i + 1}-variant`, k, o.text, co[i].text);
      });
      const sid = so.map((o) => o.id).join(',');
      const cid = co.map((o) => o.id).join(',');
      if (sid !== cid) add(l, 'variant id', 'format', sid, cid);
    }
    const sc = correctIdx(so);
    const cc = correctIdx(co);
    if (sc !== cc) add(l, 'TO‘G‘RI JAVOB', 'content', sc || '—', cc || '—');

    if (copy.izoh && typeof copy.izoh === 'object') {
      const k = cmpText(site.izoh?.[l], copy.izoh[l]);
      if (k) add(l, 'izoh', k, site.izoh?.[l] ?? '(yo‘q)', copy.izoh[l] ?? '(yo‘q)');
    }
  }
  return diffs;
}

// ── sayt (manba) ────────────────────────────────────────────────────────────

function loadSite() {
  const problems = [];
  const bank = questionsOf(readJson(path.join(SITE, 'barcha.json')));
  const canon = new Map();
  for (const q of bank) {
    const gid = q.task_info.global_id;
    if (canon.has(gid)) problems.push(`barcha.json: ${gid} ikki marta uchraydi`);
    canon.set(gid, q);
  }

  for (const q of bank) {
    const gid = q.task_info.global_id;
    for (const l of LANGS) {
      const c = q.content[l];
      if (!c || !String(c.text || '').trim()) { problems.push(`${gid}: ${l} savol matni yo‘q`); continue; }
      const opts = c.options || [];
      if (opts.length < 2) problems.push(`${gid}: ${l} variantlar ${opts.length} ta`);
      const correct = opts.filter((o) => o.is_correct).length;
      if (correct !== 1) problems.push(`${gid}: ${l} to‘g‘ri javoblar soni ${correct} (1 bo‘lishi kerak)`);
      if (opts.some((o) => !String(o.text || '').trim())) problems.push(`${gid}: ${l} bo‘sh variant matni`);
    }
    // Ruscha variantlar tartibi rasmiy imtihondagidek boshqacha — to'g'ri javob
    // indeksini tillar orasida solishtirib bo'lmaydi, faqat har til o'zi bilan.
    const m = mediaName(q.media_url);
    if (m && !/^https?:/i.test(m) && !exists(path.join(SITE, 'images', m))) problems.push(`${gid}: rasm yo‘q public/images/${m}`);
  }

  // Tilga bo'lingan PRO fayllar — to'plami barcha.json bilan bir xil bo'lishi kerak.
  for (const f of ['barcha-uz-lat.json', 'barcha-uz-cyr.json', 'barcha-ru.json']) {
    const ids = new Set(idsOf(readJson(path.join(SITE, f))));
    const miss = [...canon.keys()].filter((g) => !ids.has(g));
    const extra = [...ids].filter((g) => !canon.has(g));
    if (miss.length || extra.length) problems.push(`${f}: ${miss.length} yetishmaydi, ${extra.length} ortiqcha (${[...miss, ...extra].slice(0, 5).join(', ')})`);
  }

  // Bepul baza — hamma manbalar bitta to'plamni bildirishi kerak.
  const freeSources = {
    'free-uz-lat.json': idsOf(readJson(path.join(SITE, 'free-uz-lat.json'))),
    'free-uz-cyr.json': idsOf(readJson(path.join(SITE, 'free-uz-cyr.json'))),
    'free-ru.json': idsOf(readJson(path.join(SITE, 'free-ru.json'))),
  };
  const optional = {
    '600.json': path.join(SITE, '600.json'),
    'data/free-question-ids.json': path.join(SITE, 'data', 'free-question-ids.json'),
    'scripts/question-tools/free-tier-question-ids.json': path.join(projectRoot, 'scripts', 'question-tools', 'free-tier-question-ids.json'),
  };
  for (const [k, p] of Object.entries(optional)) if (exists(p)) freeSources[k] = idsOf(readJson(p));
  const free = new Set(freeSources['free-uz-lat.json']);
  for (const [k, ids] of Object.entries(freeSources)) {
    const set = new Set(ids);
    if (set.size !== ids.length) problems.push(`${k}: takroriy ID bor (${ids.length - set.size} ta)`);
    const miss = [...free].filter((g) => !set.has(g));
    const extra = [...set].filter((g) => !free.has(g));
    if (miss.length || extra.length) problems.push(`${k}: bepul ro‘yxat free-uz-lat.json dan farq qiladi (−${miss.length} / +${extra.length})`);
  }
  const notInBank = [...free].filter((g) => !canon.has(g));
  if (notInBank.length) problems.push(`bepul ro‘yxatda barcha.json da yo‘q ID lar: ${notInBank.slice(0, 5).join(', ')}`);

  // Variantlar — aynan 20 savol, takroriy ID yo'q, hammasi bankda.
  const variantFiles = listJson(path.join(SITE, 'data', 'variants')).sort(byNumber);
  const variants = new Map();
  const warnings = [];
  for (const f of variantFiles) {
    const ids = idsOf(readJson(path.join(SITE, 'data', 'variants', f)));
    variants.set(f, ids);
    if (ids.length !== 20) {
      const last = f === variantFiles[variantFiles.length - 1];
      (last ? warnings : problems).push(`data/variants/${f}: ${ids.length} ta savol (20 bo‘lishi kerak)${last ? ' — oxirgi variant, hali to‘ldirilmoqda' : ''}`);
    }
    if (new Set(ids).size !== ids.length) problems.push(`data/variants/${f}: takroriy ID`);
    const unknown = ids.filter((g) => !canon.has(g));
    if (unknown.length) problems.push(`data/variants/${f}: barcha.json da yo‘q: ${unknown.join(', ')}`);
  }

  const themes = new Map();
  for (const f of listJson(path.join(SITE, 'mavzuli2')).sort(byNumber)) {
    const ids = idsOf(readJson(path.join(SITE, 'mavzuli2', f)));
    themes.set(f, ids);
    const unknown = ids.filter((g) => !canon.has(g));
    if (unknown.length) problems.push(`mavzuli2/${f}: barcha.json da yo‘q: ${unknown.slice(0, 5).join(', ')}`);
  }

  // Versiya fayli — ilovalar o'z nusxasini shu bilan solishtiradi.
  const versionPath = path.join(SITE, 'data', 'questions-version.json');
  let version = null;
  if (!exists(versionPath)) {
    problems.push('data/questions-version.json yo‘q — node scripts/question-tools/generate-questions-version.cjs');
  } else {
    version = readJson(versionPath);
    const hash = contentHash(fs.readFileSync(path.join(SITE, 'barcha.json')));
    if (version.barchaSha256 !== hash || version.questions !== canon.size
      || version.free !== free.size || version.variants !== variantFiles.length) {
      problems.push('data/questions-version.json eskirgan (barcha.json yoki sonlar mos emas) — generate-questions-version.cjs ni ishga tushiring');
    }
  }

  const imageSizesPath = path.join(projectRoot, 'src', 'data', 'question-image-sizes.json');
  return {
    canon, free, variants, themes, problems, warnings, version,
    belgilar: exists(path.join(SITE, 'data', 'belgilar.json')) ? readJson(path.join(SITE, 'data', 'belgilar.json')) : null,
    qiyin: exists(path.join(SITE, 'data', 'qiyin-savollar.json')) ? readJson(path.join(SITE, 'data', 'qiyin-savollar.json')) : null,
    imageSizes: exists(imageSizesPath) ? readJson(imageSizesPath) : null,
  };
}

// ── nusxani tekshirish ──────────────────────────────────────────────────────

function newCopyResult(name, root) {
  return {
    name, root, found: exists(root),
    counts: {},            // fayl -> savollar soni
    missing: new Set(),    // saytda bor, bankda yo'q
    extra: new Set(),      // bankda bor, saytda yo'q
    diffs: new Map(),      // gid -> [{lang, field, kind, site, copy, files:Set}]
    lists: [],             // bepul/variant/mavzu ro'yxatlari farqi (matn)
    images: [],            // yetishmaydigan rasmlar
    info: [],              // exit code ga ta'sir qilmaydigan eslatmalar
  };
}

function recordDiffs(res, gid, diffs, file) {
  if (!diffs.length) return;
  const list = res.diffs.get(gid) || [];
  for (const d of diffs) {
    const same = list.find((x) => x.lang === d.lang && x.field === d.field && x.kind === d.kind && x.copy === d.copy);
    if (same) same.files.add(file);
    else list.push({ ...d, files: new Set([file]) });
  }
  res.diffs.set(gid, list);
}

function checkBankFile(res, site, file, data, expected) {
  const qs = questionsOf(data);
  res.counts[file] = qs.length;
  const seen = new Set();
  for (const q of qs) {
    const gid = q.task_info.global_id;
    if (seen.has(gid)) res.lists.push(`${file}: ${gid} ikki marta`);
    seen.add(gid);
    const s = site.canon.get(gid);
    if (!s) { if (expected) res.extra.add(gid); continue; }
    recordDiffs(res, gid, compareQuestion(s, q), file);
  }
  if (expected) {
    for (const gid of expected) if (!seen.has(gid)) res.missing.add(gid);
  }
  return seen;
}

function compareIdLists(res, label, siteMap, copyDir, copyNameFor) {
  const copyFiles = new Set(listJson(copyDir));
  for (const [f, siteIds] of siteMap) {
    const cf = copyNameFor(f);
    if (!copyFiles.has(cf)) { res.lists.push(`${label}/${cf}: fayl yo‘q (saytda ${siteIds.length} savol)`); continue; }
    copyFiles.delete(cf);
    const ids = idsOf(readJson(path.join(copyDir, cf)));
    if (ids.join('|') === siteIds.join('|')) continue;
    const s = new Set(siteIds);
    const c = new Set(ids);
    const miss = siteIds.filter((g) => !c.has(g));
    const extra = ids.filter((g) => !s.has(g));
    if (!miss.length && !extra.length) res.lists.push(`${label}/${cf}: tartibi farq qiladi`);
    else res.lists.push(`${label}/${cf}: ${ids.length}/${siteIds.length} savol; yo‘q: ${miss.join(', ') || '—'}; ortiqcha: ${extra.join(', ') || '—'}`);
  }
  for (const cf of copyFiles) res.lists.push(`${label}/${cf}: saytda bunday fayl yo‘q`);
}

function compareFree(res, label, ids, site) {
  const set = new Set(ids);
  const miss = [...site.free].filter((g) => !set.has(g));
  const extra = [...set].filter((g) => !site.free.has(g));
  if (set.size !== ids.length) res.lists.push(`${label}: takroriy ID (${ids.length - set.size} ta)`);
  if (miss.length || extra.length) {
    res.lists.push(`${label}: ${set.size} ta (saytda ${site.free.size}); bepul bo‘lishi kerak, lekin yo‘q: ${miss.join(', ') || '—'}; ortiqcha: ${extra.join(', ') || '—'}`);
  }
}

function checkImages(res, root, imagesDir, fileLabel, questions) {
  const seen = new Set();
  for (const q of questions) {
    const m = mediaName(q.media_url);
    if (!m || /^https?:/i.test(m) || seen.has(m)) continue;
    seen.add(m);
    if (!exists(path.join(root, imagesDir, m))) res.images.push(`${q.task_info.global_id}: ${imagesDir}/${m} (${fileLabel})`);
  }
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function checkVersionCopy(res, site, relPath) {
  if (!site.version) return;
  const p = path.join(res.root, relPath);
  if (!exists(p)) { res.lists.push(`${relPath}: yo‘q — sinxron generatori uni ham ko‘chirishi kerak`); return; }
  if (readJson(p).barchaSha256 !== site.version.barchaSha256) res.lists.push(`${relPath}: saytdagi versiyadan farq qiladi`);
}

function auditMobile(site) {
  const res = newCopyResult('Mobil ilova (Flutter)', MOBILE);
  if (!res.found) return res;

  const bank = readJson(path.join(MOBILE, 'barcha.json'));
  checkBankFile(res, site, 'barcha.json', bank, [...site.canon.keys()]);
  checkImages(res, MOBILE, 'images', 'barcha.json', questionsOf(bank));
  // Sinxrondan keyin kerak bo'ladigan rasmlar — manbada bor, mobilda yo'q.
  for (const gid of res.missing) {
    const m = mediaName(site.canon.get(gid).media_url);
    if (m && !exists(path.join(MOBILE, 'images', m))) res.info.push(`${gid} sinxron qilinganda images/${m} ham qo‘shiladi`);
  }

  compareFree(res, 'free_ids.json', idsOf(readJson(path.join(MOBILE, 'free_ids.json'))), site);
  compareIdLists(res, 'variants', site.variants, path.join(MOBILE, 'variants'), (f) => f);
  compareIdLists(res, 'themes', site.themes, path.join(MOBILE, 'themes'), (f) => f);

  // Kengaytirilgan (ID ro'yxatiga aylantirilmagan) mavzu/variant fayllari — mazmunini ham tekshiramiz.
  for (const dir of ['variants', 'themes']) {
    for (const f of listJson(path.join(MOBILE, dir))) {
      const data = readJson(path.join(MOBILE, dir, f));
      if (questionsOf(data).length) checkBankFile(res, site, `${dir}/${f}`, data, null);
    }
  }

  if (site.imageSizes) {
    const p = path.join(MOBILE, 'image-sizes.json');
    if (!exists(p)) res.lists.push('image-sizes.json: fayl yo‘q');
    else if (!sameJson(readJson(p), site.imageSizes)) res.lists.push('image-sizes.json: saytdagi src/data/question-image-sizes.json dan farq qiladi');
  }
  checkVersionCopy(res, site, 'questions-version.json');
  if (site.belgilar) {
    const p = path.join(MOBILE, 'belgilar.json');
    if (!exists(p)) res.lists.push('belgilar.json: fayl yo‘q');
    else if (!sameJson(readJson(p), site.belgilar)) res.lists.push('belgilar.json: saytdagi data/belgilar.json dan farq qiladi');
  }
  return res;
}

function auditDesktop(site) {
  const res = newCopyResult('Kompyuter ilovasi (Tauri)', DESKTOP);
  if (!res.found) return res;

  const all = [...site.canon.keys()];
  const images = [];
  for (const f of ['barcha.json', 'barcha-uz-lat.json', 'barcha-uz-cyr.json', 'barcha-ru.json']) {
    const p = path.join(DESKTOP, f);
    if (!exists(p)) { res.lists.push(`${f}: fayl yo‘q`); continue; }
    const data = readJson(p);
    checkBankFile(res, site, f, data, all);
    images.push(...questionsOf(data));
  }
  for (const f of ['free-uz-lat.json', 'free-uz-cyr.json', 'free-ru.json', '600.json']) {
    const p = path.join(DESKTOP, f);
    if (!exists(p)) { res.lists.push(`${f}: fayl yo‘q`); continue; }
    const data = readJson(p);
    const seen = checkBankFile(res, site, f, data, null);
    compareFree(res, f, [...seen], site);
    images.push(...questionsOf(data));
  }
  const fq = path.join(DESKTOP, 'data', 'free-question-ids.json');
  if (exists(fq)) compareFree(res, 'data/free-question-ids.json', idsOf(readJson(fq)), site);

  compareIdLists(res, 'data/variants', site.variants, path.join(DESKTOP, 'data', 'variants'), (f) => f);
  compareIdLists(res, 'mavzuli2', site.themes, path.join(DESKTOP, 'mavzuli2'), (f) => f);
  for (const [dir, label] of [[path.join('data', 'variants'), 'data/variants'], ['mavzuli2', 'mavzuli2']]) {
    for (const f of listJson(path.join(DESKTOP, dir))) {
      const data = readJson(path.join(DESKTOP, dir, f));
      checkBankFile(res, site, `${label}/${f}`, data, null);
      images.push(...questionsOf(data));
    }
  }
  checkImages(res, DESKTOP, 'images', 'savol fayllari', images);
  checkVersionCopy(res, site, path.join('data', 'questions-version.json'));

  if (site.belgilar) {
    const p = path.join(DESKTOP, 'data', 'belgilar.json');
    if (!exists(p)) res.lists.push('data/belgilar.json: fayl yo‘q');
    else if (!sameJson(readJson(p), site.belgilar)) res.lists.push('data/belgilar.json: saytdagidan farq qiladi');
  }
  if (site.qiyin) {
    const p = path.join(DESKTOP, 'data', 'qiyin-savollar.json');
    if (!exists(p)) res.info.push('data/qiyin-savollar.json: fayl yo‘q');
    else if (!sameJson(readJson(p), site.qiyin)) {
      const d = readJson(p);
      res.info.push(`data/qiyin-savollar.json: saytdagidan farq qiladi (ilovada sana ${d.sana || '?'}, saytda ${site.qiyin.sana || '?'}) — statistik fayl, sinxronda yangilanadi`);
    }
  }
  return res;
}

function auditBot() {
  const dir = path.join(projectRoot, 'supabase', 'functions');
  const hits = [];
  const walk = (d) => {
    for (const n of fs.readdirSync(d)) {
      const p = path.join(d, n);
      if (fs.statSync(p).isDirectory()) { walk(p); continue; }
      if (!/\.(ts|js|json)$/.test(n)) continue;
      const txt = fs.readFileSync(p, 'utf8');
      if (/global_id|barcha(-uz-lat|-uz-cyr|-ru)?\.json|free-(uz-lat|uz-cyr|ru)\.json|data\/variants\/v\d/.test(txt)) hits.push(path.relative(projectRoot, p));
    }
  };
  if (exists(dir)) walk(dir);
  return hits;
}

// ── hisobot ─────────────────────────────────────────────────────────────────

function summarize(res) {
  let content = 0;
  let format = 0;
  const answerIds = [];
  const perLang = { uz_lat: 0, uz_cyr: 0, ru: 0, umumiy: 0 };
  for (const [gid, list] of res.diffs) {
    const c = list.filter((d) => d.kind === 'content');
    if (c.length) content++;
    else format++;
    if (list.some((d) => d.field === 'TO‘G‘RI JAVOB')) answerIds.push(gid);
    for (const d of c) perLang[d.lang || 'umumiy']++;
  }
  const failing = content + res.missing.size + res.extra.size + res.lists.length + res.images.length;
  return { content, format, answerIds, perLang, failing };
}

function fmtFiles(set) {
  const a = [...set];
  return a.length > 3 ? `${a.slice(0, 3).join(', ')} +${a.length - 3}` : a.join(', ');
}

function consoleCopy(res) {
  console.log(`\n=== ${res.name} — ${res.root}`);
  if (!res.found) { console.log('  papka topilmadi — o‘tkazib yuborildi'); return; }
  const s = summarize(res);
  console.log(`  savollar: ${Object.entries(res.counts).filter(([f]) => /^(barcha|free|600)/.test(f)).map(([f, n]) => `${f}=${n}`).join(', ')}`);
  console.log(`  saytda bor, bu yerda yo‘q: ${res.missing.size}${res.missing.size ? ` (${[...res.missing].slice(0, 20).join(', ')}${res.missing.size > 20 ? ' …' : ''})` : ''}`);
  console.log(`  ortiqcha (saytda yo‘q): ${res.extra.size}${res.extra.size ? ` (${[...res.extra].slice(0, 10).join(', ')})` : ''}`);
  console.log(`  mazmun farqi: ${s.content} savol (uz_lat ${s.perLang.uz_lat}, uz_cyr ${s.perLang.uz_cyr}, ru ${s.perLang.ru}, umumiy ${s.perLang.umumiy} ta maydon)`);
  console.log(`  TO‘G‘RI JAVOB farqi: ${s.answerIds.length}${s.answerIds.length ? ` — ${s.answerIds.join(', ')}` : ''}`);
  console.log(`  faqat format farqi: ${s.format} savol`);
  console.log(`  ro‘yxat/fayl farqlari: ${res.lists.length}; yetishmaydigan rasmlar: ${res.images.length}`);
  for (const l of res.lists.slice(0, 15)) console.log(`    - ${l}`);
  if (res.lists.length > 15) console.log(`    … yana ${res.lists.length - 15}`);
  for (const [gid, list] of res.diffs) {
    for (const d of list.filter((x) => x.kind === 'content')) {
      console.log(`    ${gid} [${d.lang || '—'}] ${d.field}: sayt «${short(d.site, 70)}» ≠ «${short(d.copy, 70)}» (${fmtFiles(d.files)})`);
    }
  }
}

function mdEscape(s) {
  return String(s).replace(/\|/g, '\\|');
}

function markdown(site, copies, botHits) {
  const L = [];
  const date = tashkentDate();
  L.push(`# Savollar sinxroni hisoboti — ${date}`);
  L.push('');
  L.push(`Manba: \`public/barcha.json\` — **${site.canon.size}** savol, bepul **${site.free.size}**, variantlar **${site.variants.size}**, mavzular **${site.themes.size}**.`);
  L.push('');
  L.push('Yaratildi: `node scripts/question-tools/audit-cross-app-sync.cjs` (faqat o‘qiydi).');
  L.push('');

  L.push('## Xulosa');
  L.push('');
  L.push('| Nusxa | Savollar | Saytda bor, yo‘q | Ortiqcha | Mazmun farqi | To‘g‘ri javob farqi | Faqat format | Ro‘yxat/fayl | Rasm yo‘q |');
  L.push('|---|---|---|---|---|---|---|---|---|');
  for (const r of copies) {
    if (!r.found) { L.push(`| ${r.name} | papka topilmadi | | | | | | | |`); continue; }
    const s = summarize(r);
    const n = r.counts['barcha.json'] ?? '—';
    L.push(`| ${r.name} | ${n} | ${r.missing.size} | ${r.extra.size} | ${s.content} | ${s.answerIds.length} | ${s.format} | ${r.lists.length} | ${r.images.length} |`);
  }
  L.push(`| Telegram bot | savol nusxasi yo‘q — saytni (Mini App) jonli ochadi | | | | | | ${botHits.length} | |`);
  L.push('');

  L.push('## Sayt (manba) tekshiruvi');
  L.push('');
  if (!site.problems.length && !site.warnings.length) L.push('Xato yo‘q.');
  for (const p of site.problems) L.push(`- ❌ ${p}`);
  for (const w of site.warnings) L.push(`- ⚠️ ${w}`);
  L.push('');

  for (const r of copies) {
    L.push(`## ${r.name}`);
    L.push('');
    L.push(`Yo‘l: \`${r.root}\``);
    L.push('');
    if (!r.found) { L.push('Papka topilmadi.'); L.push(''); continue; }
    const s = summarize(r);
    L.push('Fayllardagi savollar soni: ' + Object.entries(r.counts).filter(([f]) => !f.includes('/')).map(([f, n]) => `\`${f}\` ${n}`).join(', '));
    L.push('');
    L.push(`Mazmun farqi tillar kesimida (maydonlar): uz_lat ${s.perLang.uz_lat}, uz_cyr ${s.perLang.uz_cyr}, ru ${s.perLang.ru}, tilga bog‘liq bo‘lmagan ${s.perLang.umumiy}.`);
    L.push('');
    if (r.missing.size) {
      L.push(`### Saytda bor, bu yerda yo‘q (${r.missing.size})`);
      L.push('');
      L.push([...r.missing].map((g) => `\`${g}\``).join(', '));
      L.push('');
    }
    if (r.extra.size) {
      L.push(`### Ortiqcha — saytda yo‘q (${r.extra.size})`);
      L.push('');
      L.push([...r.extra].map((g) => `\`${g}\``).join(', '));
      L.push('');
    }
    const contentRows = [];
    const formatIds = [];
    for (const [gid, list] of r.diffs) {
      const c = list.filter((d) => d.kind === 'content');
      if (!c.length) { formatIds.push(gid); continue; }
      for (const d of c) contentRows.push(`| \`${gid}\` | ${d.lang || '—'} | ${d.field} | ${mdEscape(short(d.site))} | ${mdEscape(short(d.copy))} | ${fmtFiles(d.files)} |`);
    }
    if (contentRows.length) {
      L.push(`### Mazmun farqlari (${s.content} savol)`);
      L.push('');
      L.push('| ID | Til | Maydon | Saytda | Bu nusxada | Fayl |');
      L.push('|---|---|---|---|---|---|');
      L.push(...contentRows);
      L.push('');
    }
    if (formatIds.length) {
      L.push(`### Faqat format farqi (${formatIds.length} savol)`);
      L.push('');
      L.push('Tipografiya (bo‘shliq, apostrof/qo‘shtirnoq/tire shakli, variant id). Foydalanuvchi ko‘radigan ma’no o‘zgarmaydi; generator bilan sinxron qilinganda o‘zi yo‘qoladi.');
      L.push('');
      L.push(formatIds.slice(0, 200).map((g) => `\`${g}\``).join(', ') + (formatIds.length > 200 ? ` … (+${formatIds.length - 200})` : ''));
      L.push('');
    }
    if (r.lists.length) {
      L.push(`### Bepul ro‘yxat, variant va mavzu fayllari (${r.lists.length})`);
      L.push('');
      for (const l of r.lists) L.push(`- ${mdEscape(l)}`);
      L.push('');
    }
    if (r.images.length) {
      L.push(`### Yetishmaydigan rasmlar (${r.images.length})`);
      L.push('');
      for (const l of r.images) L.push(`- ${l}`);
      L.push('');
    }
    if (r.info.length) {
      L.push('### Eslatmalar (chiqish kodiga ta’sir qilmaydi)');
      L.push('');
      for (const l of r.info) L.push(`- ${l}`);
      L.push('');
    }
  }

  L.push('## Telegram bot');
  L.push('');
  if (!botHits.length) L.push('`supabase/functions` ichida savol ma’lumoti yoki savol fayllariga havola yo‘q. `telegram-public-bot` foydalanuvchini saytga (Mini App) yo‘naltiradi — savollar doim saytdan, alohida sinxron kerak emas.');
  else for (const h of botHits) L.push(`- ❌ savol ma’lumotiga havola: \`${h}\``);
  L.push('');
  return { text: L.join('\n'), date };
}

// ── asosiy ──────────────────────────────────────────────────────────────────

function main() {
  const site = loadSite();
  console.log(`Manba: ${SITE}`);
  console.log(`  barcha.json ${site.canon.size} savol, bepul ${site.free.size}, variantlar ${site.variants.size}, mavzular ${site.themes.size}`);
  for (const p of site.problems) console.log(`  ❌ ${p}`);
  for (const w of site.warnings) console.log(`  ⚠️  ${w}`);

  const copies = [auditMobile(site), auditDesktop(site)];
  for (const r of copies) consoleCopy(r);

  const botHits = auditBot();
  console.log(`\n=== Telegram bot — ${botHits.length ? `savol ma’lumotiga havola: ${botHits.join(', ')}` : 'savol nusxasi yo‘q, saytni jonli ochadi'}`);

  if (args.report) {
    const { text, date } = markdown(site, copies, botHits);
    const dir = path.join(projectRoot, 'reports');
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, `sync-${date}.md`);
    fs.writeFileSync(out, text, 'utf8');
    console.log(`\nHisobot: ${path.relative(projectRoot, out)}`);
  }

  const failing = site.problems.length + botHits.length
    + copies.filter((r) => r.found).reduce((n, r) => n + summarize(r).failing, 0);
  console.log(failing ? `\nNATIJA: ${failing} ta farq/xato — sinxron kerak.` : '\nNATIJA: 0 farq.');
  process.exitCode = failing ? 1 : 0;
}

main();
