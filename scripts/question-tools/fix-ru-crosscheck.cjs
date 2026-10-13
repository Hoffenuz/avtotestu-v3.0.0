// ============================================================================
// fix-ru-crosscheck.cjs — ruscha matn (savol, variantlar, izoh) tuzatishlarini
// BITTA jadvaldan (ru-crosscheck/ops-*.json) qo'llaydi va barcha nusxalarga
// (variants, mavzuli2, barcha*, free*, 600.json) bir xil tarqatadi.
//
//   node scripts/question-tools/fix-ru-crosscheck.cjs            # quruq sinov (hech narsa yozmaydi)
//   node scripts/question-tools/fix-ru-crosscheck.cjs --apply    # yozadi
//   (ops tartibi: auto, auto2, manual; --no-manual: manualsiz; --stage1: faqat ops-auto.json)
//   node scripts/question-tools/fix-ru-crosscheck.cjs --dry out.json   # tuzatilgan kanonik nusxani JSON ga chiqaradi
//
// Operatsiya turlari (ops-auto.json, ops-manual.json — massiv):
//   { gid, f: "Q" | "O1".."O5" | "I", sub: [eski, yangi], all?: true }
//        eski matn aynan 1 marta topilishi shart (all: true bo'lsa — kamida 1 marta).
//        Yangi matn allaqachon bor, eskisi yo'q bo'lsa — o'tkazib yuboriladi (idempotent).
//   { gid, f, set: "to'liq yangi matn", expect: "eski matn boshi (tekshiruv uchun)" }
//   { gid, flag: n }   ruscha to'g'ri javob = n-variant (1 dan)
//   { gid, izohUz: { uz_lat, uz_cyr } }   uzbekcha izohni to'g'ridan-to'g'ri o'rnatadi (manba muammosi: izoh savolga mos emas)
//   { gid, copyIzohFrom: gid2 }   izohni (uz_lat, uz_cyr, ru — uchala til) boshqa savoldan ko'chiradi
//        (manba: izoh savolga mos emas, to'g'ri izoh boshqa savolda mavjud). Barcha boshqa amallardan KEYIN bajariladi.
//
// Xavfsizlik: boshqa fayllardagi nusxa kanonik (tuzatishdan oldingi) YOKI
// tuzatilgan matn bilan bir xil bo'lishi shart; aks holda to'xtaydi.
// ============================================================================
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PUBLIC = path.join(ROOT, 'public');
const VARIANTS = path.join(PUBLIC, 'data', 'variants');
const OPS_DIR = path.join(__dirname, 'ru-crosscheck');
const APPLY = process.argv.includes('--apply');
const dryIdx = process.argv.indexOf('--dry');
const DRY_OUT = dryIdx >= 0 ? process.argv[dryIdx + 1] : null;

function walkJson(dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) walkJson(p, out);
    else if (n.endsWith('.json')) out.push(p);
  }
  return out;
}

/** Fayl formatini aniqlash (qayta yozishda diff shovqini bo'lmasligi uchun). */
function detectFormat(raw, data) {
  const cands = [
    ['min', () => JSON.stringify(data)],
    ['i4', () => JSON.stringify(data, null, 4)],
    ['i2', () => JSON.stringify(data, null, 2)],
  ];
  for (const [name, fn] of cands) {
    const s = fn();
    for (const tail of ['', '\n']) if (s + tail === raw) return { name, tail };
  }
  return null;
}
function serialize(data, fmt) {
  const s = fmt.name === 'min' ? JSON.stringify(data) : JSON.stringify(data, null, fmt.name === 'i4' ? 4 : 2);
  return s + fmt.tail;
}

function eachQuestion(node, cb) {
  if (Array.isArray(node)) { for (const x of node) eachQuestion(x, cb); return; }
  if (node && typeof node === 'object') {
    if (node.task_info && node.task_info.global_id && node.content) { cb(node); return; }
    for (const k of Object.keys(node)) if (node[k] && typeof node[k] === 'object') eachQuestion(node[k], cb);
  }
}

// ---------- 1) kanonik ruscha holat ----------
const canon = new Map(); // gid -> { Q, O:[], I, flagIdx }
const canonQ = new Map(); // gid -> question object (variants)
for (const f of fs.readdirSync(VARIANTS).filter((n) => /^v\d+\.json$/.test(n))) {
  const data = JSON.parse(fs.readFileSync(path.join(VARIANTS, f), 'utf8'));
  eachQuestion(data, (q) => {
    const ru = q.content.ru;
    canon.set(q.task_info.global_id, {
      Q: ru.text,
      O: ru.options.map((o) => o.text),
      I: (q.izoh && q.izoh.ru) || '',
      C: ru.options.findIndex((o) => o.is_correct),
    });
    canonQ.set(q.task_info.global_id, q);
  });
}
const before = new Map([...canon].map(([g, v]) => [g, JSON.parse(JSON.stringify(v))]));

// ---------- 2) operatsiyalar ----------
const ops = [];
const NO_MANUAL = process.argv.includes('--no-manual');
const STAGE1 = process.argv.includes('--stage1');
for (const name of STAGE1 ? ['ops-auto.json'] : ['ops-auto.json', 'ops-auto2.json', ...(NO_MANUAL ? [] : ['ops-manual.json'])]) {
  const p = path.join(OPS_DIR, name);
  if (fs.existsSync(p)) for (const op of JSON.parse(fs.readFileSync(p, 'utf8'))) ops.push({ ...op, _src: name });
}
const errors = [];
const copies = [];
const uzIzoh = new Map(); // gid -> { uz_lat, uz_cyr } (yakuniy izoh matnlari)
let applied = 0, skipped = 0;
function getField(c, f) {
  if (f === 'Q') return c.Q;
  if (f === 'I') return c.I;
  const m = /^O(\d)$/.exec(f);
  return m ? c.O[+m[1] - 1] : undefined;
}
function setField(c, f, v) {
  if (f === 'Q') c.Q = v; else if (f === 'I') c.I = v; else c.O[+/^O(\d)$/.exec(f)[1] - 1] = v;
}
for (const op of ops) {
  const c = canon.get(op.gid);
  if (!c) { errors.push(`${op.gid}: kanonikda yo'q (${op._src})`); continue; }
  if (op.copyIzohFrom) { copies.push(op); continue; }
  if (op.izohUz) { uzIzoh.set(op.gid, { ...(uzIzoh.get(op.gid) || {}), ...op.izohUz }); applied++; continue; }
  if (op.flag !== undefined) {
    if (c.C === op.flag - 1) { skipped++; continue; }
    c.C = op.flag - 1; applied++; continue;
  }
  const cur = getField(c, op.f);
  if (cur === undefined) { errors.push(`${op.gid} ${op.f}: maydon yo'q`); continue; }
  if (op.sub) {
    const [oldS, newS] = op.sub;
    const n = cur.split(oldS).length - 1;
    if (n === 0) {
      if (cur.includes(newS)) { skipped++; continue; }
      errors.push(`${op.gid} ${op.f}: eski matn topilmadi: ${JSON.stringify(oldS).slice(0, 80)}`); continue;
    }
    if (n > 1 && !op.all) { errors.push(`${op.gid} ${op.f}: eski matn ${n} marta topildi (all:true kerak): ${JSON.stringify(oldS).slice(0, 80)}`); continue; }
    setField(c, op.f, cur.split(oldS).join(newS)); applied++;
  } else if (op.set !== undefined) {
    if (cur === op.set) { skipped++; continue; }
    if (op.expect && !cur.startsWith(op.expect)) { errors.push(`${op.gid} ${op.f}: expect mos kelmadi (${JSON.stringify(cur.slice(0, 40))})`); continue; }
    setField(c, op.f, op.set); applied++;
  } else errors.push(`${op.gid}: noma'lum operatsiya`);
}
for (const op of copies) {
  const src = canon.get(op.copyIzohFrom), dst = canon.get(op.gid);
  if (!src || !dst) { errors.push(`${op.gid}: copyIzohFrom manba/maqsad yo'q`); continue; }
  if (dst.I !== src.I) { dst.I = src.I; applied++; } else skipped++;
  const sq = canonQ.get(op.copyIzohFrom).izoh || {};
  uzIzoh.set(op.gid, { ...(uzIzoh.get(op.gid) || {}), uz_lat: sq.uz_lat, uz_cyr: sq.uz_cyr });
}
// to'g'ri javob: aniq bitta
for (const [g, c] of canon) if (c.C < 0) errors.push(`${g}: ruscha to'g'ri javob yo'q`);

const changed = new Set();
for (const [g, c] of canon) if (JSON.stringify(c) !== JSON.stringify(before.get(g))) changed.add(g);
for (const [g, v] of uzIzoh) {
  const cur = (canonQ.get(g) || {}).izoh || {};
  if (['uz_lat', 'uz_cyr'].some((l) => v[l] !== undefined && v[l] !== cur[l])) changed.add(g);
}
console.log(`operatsiyalar: ${ops.length}, qo'llandi: ${applied}, o'tkazildi (allaqachon bor): ${skipped}, o'zgargan savol: ${changed.size}`);
if (errors.length) {
  console.log(`\nXATOLAR (${errors.length}):`);
  for (const e of errors) console.log('  - ' + e);
  console.log('\nXato bor — hech narsa yozilmadi.');
  process.exit(1);
}

// ---------- 3) dry: kanonik nusxani JSON ga ----------
if (DRY_OUT) {
  const out = [];
  for (const f of fs.readdirSync(VARIANTS).filter((n) => /^v\d+\.json$/.test(n))) {
    const data = JSON.parse(fs.readFileSync(path.join(VARIANTS, f), 'utf8'));
    eachQuestion(data, (q) => {
      const g = q.task_info.global_id, c = canon.get(g);
      out.push({
        gid: g, file: f, media: q.media_url || null, remapped: q.task_info.remapped_from || null,
        uz: q.content.uz_lat, cyr: q.content.uz_cyr,
        ru: { text: c.Q, options: q.content.ru.options.map((o, k) => ({ id: o.id, text: c.O[k], is_correct: k === c.C })) },
        izoh_uz: (uzIzoh.get(g) || {}).uz_lat || (q.izoh || {}).uz_lat || '', izoh_ru: c.I,
      });
    });
  }
  fs.writeFileSync(DRY_OUT, JSON.stringify(out));
  console.log('dry yozildi:', DRY_OUT, out.length);
  process.exit(0);
}

// ---------- 4) barcha fayllarga tarqatish ----------
let filesTouched = 0, copiesN = 0;
const problems = [];
const pendingWrites = [];
for (const file of walkJson(PUBLIC)) {
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.includes('global_id')) continue;
  let data;
  try { data = JSON.parse(raw); } catch { continue; }
  let dirty = false;
  eachQuestion(data, (q) => {
    const g = q.task_info.global_id;
    if (!changed.has(g)) return;
    if (uzIzoh.has(g) && q.izoh) {
      const iz = uzIzoh.get(g);
      for (const l of ['uz_lat', 'uz_cyr']) {
        if (q.izoh[l] !== undefined && iz[l] !== undefined && q.izoh[l] !== iz[l]) { q.izoh[l] = iz[l]; dirty = true; copiesN++; }
      }
    }
    const ru = q.content && q.content.ru;
    if (!ru) return;
    const now = canon.get(g), old = before.get(g);
    const rel = path.relative(PUBLIC, file);
    // joriy nusxa: eski YOKI yangi kanonik bilan bir xil bo'lishi kerak
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const curO = ru.options.map((o) => o.text);
    const curC = ru.options.findIndex((o) => o.is_correct);
    const curI = q.izoh && q.izoh.ru !== undefined ? q.izoh.ru : undefined;
    const matchesOld = ru.text === old.Q && same(curO, old.O) && curC === old.C && (curI === undefined || curI === old.I);
    const matchesNew = ru.text === now.Q && same(curO, now.O) && curC === now.C && (curI === undefined || curI === now.I);
    if (!matchesOld && !matchesNew) { problems.push(`${g} @ ${rel}: nusxa kanonik bilan mos emas`); return; }
    if (!matchesNew) {
      ru.text = now.Q;
      ru.options.forEach((o, k) => { o.text = now.O[k]; o.is_correct = k === now.C; });
      if (curI !== undefined) q.izoh.ru = now.I;
      dirty = true; copiesN++;
    }
  });
  if (dirty) {
    const fmt = detectFormat(raw, JSON.parse(raw));
    if (!fmt) { problems.push(`${path.relative(PUBLIC, file)}: format aniqlanmadi`); continue; }
    pendingWrites.push([file, serialize(data, fmt)]);
    filesTouched++;
  }
}
if (problems.length) {
  console.log(`\nMUAMMOLAR (${problems.length}):`);
  for (const p of problems.slice(0, 40)) console.log('  - ' + p);
  console.log('\nMuammo bor — hech narsa yozilmadi.');
  process.exit(1);
}
if (APPLY) for (const [file, text] of pendingWrites) fs.writeFileSync(file, text, 'utf8');
console.log(`${APPLY ? 'YOZILDI' : 'QUYI SINOV'}: ${filesTouched} fayl, ${copiesN} nusxa o'zgaradi.`);
if (!APPLY) console.log('Yozish uchun: --apply');
