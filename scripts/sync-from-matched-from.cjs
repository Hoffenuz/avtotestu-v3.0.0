/**
 * Rebuild bank to izohlar NEW order (global_id + matched_from + global_id2),
 * using LOCAL corrected content whenever the question can be matched.
 *
 * Then sync mavzuli2 + barcha* from the new variants.
 *
 * Usage:
 *   node scripts/sync-from-matched-from.cjs           # dry-run
 *   node scripts/sync-from-matched-from.cjs --apply
 */
const fs = require("fs");
const path = require("path");

const APPLY = process.argv.includes("--apply");
const ROOT = path.join(__dirname, "..");
const IZOH_DIR = path.join(
  "C:",
  "Users",
  "Vosster PC",
  "Desktop",
  "projects",
  "izohlar",
  "variants"
);
const VAR_DIR = path.join(ROOT, "public", "data", "variants");
const MAV_DIR = path.join(ROOT, "public", "mavzuli2");
const REPORT = path.join(__dirname, "SYNC-MATCHED-FROM-REPORT.md");

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 4) + "\n", "utf8");
}

function norm(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[''`ʻʼ‘’]/g, "'")
    .replace(/vaktinchalik|vaqtinchalik/g, "vaqtinchalik")
    .replace(/taniklik|taniqlik/g, "taniqlik")
    .replace(/urnatiladi|ornatiladi|o'rnatiladi/g, "ornatiladi")
    .replace(/yukori|yuqori/g, "yuqori")
    .replace(/\biul\b|yo'l|yol/g, "yol")
    .replace(/marno|ma'no|mano/g, "mano")
    .replace(/jixatidan|jihatidan/g, "jihatidan")
    .replace(/kiladi|qiladi/g, "qiladi")
    .replace(/kilasiz|qilasiz/g, "qilasiz")
    .replace(/tugri|to'g'ri|togri/g, "togri")
    .replace(/turtinchisi|to'rtinchisi|tortinchisi/g, "tortinchisi")
    .replace(/nariroqda|nariroq/g, "nariroq")
    .replace(/yo'nalish|yunalish|iunalish/g, "yonalish")
    .replace(/ko'rin|kurin|korin/g, "korin")
    .replace(/to'xtash|toxtash|tuxtash/g, "toxtash")
    .replace(/o'tish|otish/g, "otish")
    .replace(/havfsiz|xavfsiz/g, "xavfsiz")
    .replace(/taminlash|ta'minlash|taminlash/g, "taminlash")
    .replace(/chiziq'i|chizigi|chiziqi/g, "chiziq")
    .replace(/yotik|yotiq/g, "yotiq")
    .replace(/gurux|guruh/g, "guruh")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function softSim(a, b) {
  const A = new Set(a.split(" ").filter((w) => w.length > 2));
  const B = new Set(b.split(" ").filter((w) => w.length > 2));
  if (!A.size || !B.size) return 0;
  let i = 0;
  for (const w of A) if (B.has(w)) i++;
  return i / Math.max(A.size, B.size);
}

function correctKey(block) {
  return (block?.options || [])
    .filter((o) => o.is_correct)
    .map((o) => norm(o.text))
    .sort()
    .join("||");
}

function optsKey(block) {
  return (block?.options || [])
    .map((o) => `${o.id}:${norm(o.text)}:${o.is_correct ? 1 : 0}`)
    .join("|");
}

function fp(q) {
  const L = q.content?.uz_lat;
  return {
    text: norm(L?.text),
    correct: correctKey(L),
    opts: optsKey(L),
    media: (q.media_url || "").trim(),
  };
}

function loadVariants(dir, maxTicket) {
  const byGid = new Map();
  const all = [];
  const files = [];
  for (let i = 1; i <= maxTicket; i++) {
    const p = path.join(dir, `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    files.push(p);
    const arr = loadJson(p);
    for (const q of arr) {
      all.push(q);
      const id = q.task_info?.global_id;
      if (id) byGid.set(id, q);
    }
  }
  return { byGid, all, files };
}

function indexLocal(all) {
  const byText = new Map();
  const byTextCorrect = new Map();
  const byMedia = new Map();
  for (const q of all) {
    const f = fp(q);
    if (f.text) {
      if (!byText.has(f.text)) byText.set(f.text, []);
      byText.get(f.text).push(q);
      const k = f.text + "@@" + f.correct;
      if (!byTextCorrect.has(k)) byTextCorrect.set(k, []);
      byTextCorrect.get(k).push(q);
    }
    if (f.media) {
      if (!byMedia.has(f.media)) byMedia.set(f.media, []);
      byMedia.get(f.media).push(q);
    }
  }
  return { byText, byTextCorrect, byMedia };
}

function pickUnique(list) {
  if (!list || list.length === 0) return null;
  if (list.length === 1) return list[0];
  return null;
}

function resolveLocal(izQ, localByGid, idx) {
  const mf = izQ.task_info?.matched_from;
  const izF = fp(izQ);

  // 1) matched_from + text match
  if (mf && localByGid.has(mf)) {
    const loc = localByGid.get(mf);
    const lf = fp(loc);
    if (lf.text && izF.text && lf.text === izF.text) {
      return { source: loc, via: "matched_from+text" };
    }
    if (lf.correct && izF.correct && lf.correct === izF.correct && lf.text) {
      // same correct answers but text drift — still prefer local body if options overlap strongly
      if (lf.opts === izF.opts) return { source: loc, via: "matched_from+opts" };
    }
  }

  // 2) text + correct
  if (izF.text) {
    const hits = idx.byTextCorrect.get(izF.text + "@@" + izF.correct);
    const u = pickUnique(hits);
    if (u) return { source: u, via: "text+correct" };
    const th = idx.byText.get(izF.text);
    const u2 = pickUnique(th);
    if (u2) return { source: u2, via: "text" };
    // multiple: prefer option match
    if (th && th.length > 1) {
      const byOpts = th.find((q) => fp(q).opts === izF.opts);
      if (byOpts) return { source: byOpts, via: "text+opts-disambig" };
      const byCorrect = th.find((q) => fp(q).correct === izF.correct);
      if (byCorrect) return { source: byCorrect, via: "text+correct-disambig" };
    }
  }

  // 3) media unique
  if (izF.media) {
    const u = pickUnique(idx.byMedia.get(izF.media));
    if (u) return { source: u, via: "media" };
  }

  // 4) fallback izohlar body
  return { source: izQ, via: "izohlar-fallback" };
}

function buildTaskInfo(izQ, matchedFromOverride) {
  const ti = izQ.task_info || {};
  const gid = ti.global_id;
  return {
    global_id: gid,
    global_id2: ti.global_id2 || gid,
    ticket_num: ti.ticket_num,
    order: ti.order,
    matched_from: matchedFromOverride || ti.matched_from || null,
  };
}

function cloneContentFrom(source, taskInfo) {
  return {
    task_info: taskInfo,
    media_url: source.media_url ?? null,
    content: JSON.parse(JSON.stringify(source.content)),
    izoh: JSON.parse(JSON.stringify(source.izoh || { uz_lat: "", uz_cyr: "", ru: "" })),
  };
}

function resolveForMavzuli(q, newByGid, newIdx, oldToNew) {
  const gid = q.task_info?.global_id;
  const f = fp(q);

  // A) current new gid exists and content matches
  if (gid && newByGid.has(gid)) {
    const src = newByGid.get(gid);
    const sf = fp(src);
    if (f.text && sf.text && f.text === sf.text && f.correct === sf.correct) {
      return { source: src, via: "gid-ok" };
    }
  }

  // B) gid is OLD id → map via matched_from reverse
  if (gid && oldToNew.has(gid)) {
    const newId = oldToNew.get(gid);
    const src = newByGid.get(newId);
    if (src) {
      const sf = fp(src);
      if (!f.text || !sf.text || f.text === sf.text || f.correct === sf.correct) {
        return { source: src, via: "old-id→matched_from" };
      }
    }
  }

  // C) text + correct / text / media against NEW bank
  if (f.text) {
    const hits = newIdx.byTextCorrect.get(f.text + "@@" + f.correct);
    const u = pickUnique(hits);
    if (u) return { source: u, via: "text+correct" };
    const th = newIdx.byText.get(f.text);
    const u2 = pickUnique(th);
    if (u2) return { source: u2, via: "text" };
    if (th && th.length > 1) {
      const byOpts = th.find((x) => fp(x).opts === f.opts);
      if (byOpts) return { source: byOpts, via: "text+opts" };
    }
  }
  if (f.media) {
    const u = pickUnique(newIdx.byMedia.get(f.media));
    if (u) return { source: u, via: "media" };
  }

  // D) soft text similarity + correct answer
  if (f.text && f.text.length > 20) {
    let best = { s: 0, q: null };
    for (const cand of newByGid.values()) {
      const cf = fp(cand);
      if (!cf.text) continue;
      let s = softSim(f.text, cf.text);
      if (f.correct && cf.correct && f.correct === cf.correct) s += 0.15;
      if (s > best.s) best = { s, q: cand };
    }
    if (best.q && best.s >= 0.62) {
      return { source: best.q, via: "soft-text" };
    }
  }

  return null;
}

// ── main ──────────────────────────────────────────────────────────
const local = loadVariants(VAR_DIR, 63);
const izoh = loadVariants(IZOH_DIR, 66);
const localIdx = indexLocal(local.all);

const viaCount = {};
const newTickets = new Map(); // ticket_num → questions[]
const usedLocal = new Set();
const fallbacks = [];

for (const izQ of izoh.all) {
  const ticket = izQ.task_info.ticket_num;
  const resolved = resolveLocal(izQ, local.byGid, localIdx);
  viaCount[resolved.via] = (viaCount[resolved.via] || 0) + 1;

  let matchedFrom = izQ.task_info.matched_from || null;
  if (resolved.via !== "izohlar-fallback" && resolved.source?.task_info?.global_id) {
    // Prefer actual old id we pulled from
    const oldId = resolved.source.task_info.global_id;
    usedLocal.add(oldId);
    if (!matchedFrom) matchedFrom = oldId;
    // If mf pointed wrong but we matched by text, keep mf from izohlar if set, else oldId
    if (resolved.via.startsWith("text") || resolved.via === "media") {
      matchedFrom = oldId;
    }
  }

  if (resolved.via === "izohlar-fallback") {
    fallbacks.push({
      id: izQ.task_info.global_id,
      mf: izQ.task_info.matched_from,
      q: (izQ.content?.uz_lat?.text || "").slice(0, 70),
    });
  }

  const out = cloneContentFrom(
    resolved.source,
    buildTaskInfo(izQ, matchedFrom)
  );

  if (!newTickets.has(ticket)) newTickets.set(ticket, []);
  newTickets.get(ticket).push(out);
}

// Sort each ticket by order
for (const [, arr] of newTickets) {
  arr.sort((a, b) => (a.task_info.order || 0) - (b.task_info.order || 0));
}

const unusedLocal = local.all.filter(
  (q) => !usedLocal.has(q.task_info.global_id)
);

console.log("=== Rebuild variants (izohlar skeleton + local content) ===");
console.log("Mode:", APPLY ? "APPLY" : "DRY-RUN");
console.log("izohlar qs:", izoh.all.length);
console.log("resolve via:", viaCount);
console.log("izohlar-fallback:", fallbacks.length);
console.log("local unused after map:", unusedLocal.length);

// Build new indexes for mavzuli/barcha sync
const newAll = [];
for (const [, arr] of [...newTickets.entries()].sort((a, b) => a[0] - b[0])) {
  newAll.push(...arr);
}
const newByGid = new Map(newAll.map((q) => [q.task_info.global_id, q]));
const newIdx = indexLocal(newAll);
const oldToNew = new Map();
for (const q of newAll) {
  const mf = q.task_info.matched_from;
  if (mf) oldToNew.set(mf, q.task_info.global_id);
}

// Mavzuli preview / apply
const mavFiles = fs.readdirSync(MAV_DIR).filter((f) => f.endsWith(".json")).sort();
const mavStats = { files: 0, qs: 0, synced: 0, ok: 0, unresolved: 0, via: {} };
const mavUnresolved = [];

for (const name of mavFiles) {
  const fpPath = path.join(MAV_DIR, name);
  const arr = loadJson(fpPath);
  if (!Array.isArray(arr)) continue;
  mavStats.files++;
  let changed = 0;
  for (const q of arr) {
    mavStats.qs++;
    const keepOrder = q.task_info?.order;
    const resolved = resolveForMavzuli(q, newByGid, newIdx, oldToNew);
    if (!resolved) {
      mavStats.unresolved++;
      if (mavUnresolved.length < 30) {
        mavUnresolved.push({
          file: name,
          gid: q.task_info?.global_id,
          q: (q.content?.uz_lat?.text || "").slice(0, 60),
        });
      }
      continue;
    }
    mavStats.via[resolved.via] = (mavStats.via[resolved.via] || 0) + 1;
    const src = resolved.source;
    const same =
      fp(q).text === fp(src).text &&
      fp(q).opts === fp(src).opts &&
      q.task_info?.global_id === src.task_info.global_id &&
      (q.media_url || "") === (src.media_url || "");
    if (same) {
      mavStats.ok++;
      continue;
    }
    const keep = keepOrder;
    Object.assign(q, cloneContentFrom(src, { ...src.task_info, order: keep }));
    changed++;
    mavStats.synced++;
  }
  if (APPLY && changed) {
    saveJson(fpPath, arr);
    console.log("mavzuli2/" + name + ": synced " + changed);
  }
}

console.log("\n=== Mavzuli ===");
console.log(mavStats);
if (mavUnresolved.length) {
  console.log("unresolved samples:", mavUnresolved);
}

// Apply variant writes
if (APPLY) {
  // Remove old v1..v63 then write new v1..v66
  for (let i = 1; i <= 70; i++) {
    const p = path.join(VAR_DIR, `v${i}.json`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  for (const [ticket, arr] of [...newTickets.entries()].sort((a, b) => a[0] - b[0])) {
    saveJson(path.join(VAR_DIR, `v${ticket}.json`), arr);
  }
  console.log("\nWrote variants v1..v" + Math.max(...newTickets.keys()));

  // Rebuild barcha.json from newAll
  saveJson(path.join(ROOT, "public", "barcha.json"), newAll);
  console.log("Wrote barcha.json (" + newAll.length + ")");

  // Language splits
  const lat = newAll.map((q) => ({
    task_info: q.task_info,
    media_url: q.media_url,
    content: { uz_lat: q.content.uz_lat },
    izoh: { uz_lat: q.izoh?.uz_lat || "" },
  }));
  const cyr = newAll.map((q) => ({
    task_info: q.task_info,
    media_url: q.media_url,
    content: { uz_cyr: q.content.uz_cyr },
    izoh: { uz_cyr: q.izoh?.uz_cyr || "" },
  }));
  const ru = newAll.map((q) => ({
    task_info: q.task_info,
    media_url: q.media_url,
    content: { ru: q.content.ru },
    izoh: { ru: q.izoh?.ru || "" },
  }));
  saveJson(path.join(ROOT, "public", "barcha-uz-lat.json"), lat);
  saveJson(path.join(ROOT, "public", "barcha-uz-cyr.json"), cyr);
  saveJson(path.join(ROOT, "public", "barcha-ru.json"), ru);
  console.log("Wrote barcha-uz-lat / uz-cyr / ru");

  // 600.json if present — full multi-lang copy
  const p600 = path.join(ROOT, "public", "600.json");
  if (fs.existsSync(p600)) {
    saveJson(p600, newAll);
    console.log("Wrote 600.json");
  }
}

// Report
const lines = [
  "# Sync matched_from report",
  "",
  `Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`,
  "",
  "## Variants rebuild",
  `- izohlar questions: ${izoh.all.length}`,
  `- resolve via: ${JSON.stringify(viaCount)}`,
  `- izohlar-fallback (local topilmadi): ${fallbacks.length}`,
  `- local unused: ${unusedLocal.length}`,
  "",
  "### Fallbacks (first 20)",
  ...fallbacks.slice(0, 20).map((x) => `- ${x.id} mf=${x.mf} :: ${x.q}`),
  "",
  "### Local unused (first 20)",
  ...unusedLocal
    .slice(0, 20)
    .map((q) => `- ${q.task_info.global_id} :: ${(q.content?.uz_lat?.text || "").slice(0, 60)}`),
  "",
  "## Mavzuli",
  `- ${JSON.stringify(mavStats)}`,
  "",
  "### Unresolved",
  ...mavUnresolved.map((x) => `- ${x.file} ${x.gid} :: ${x.q}`),
  "",
];
fs.writeFileSync(REPORT, lines.join("\n"), "utf8");
console.log("\nWrote", REPORT);

if (!APPLY) {
  console.log("\nDry-run only. Apply with: node scripts/sync-from-matched-from.cjs --apply");
}
