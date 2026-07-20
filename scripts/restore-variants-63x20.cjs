/**
 * Restore exam layout: variants 1–62 × 20 + variant 63 × 10 (=1250).
 * Content taken from current (izohlar-ordered) bank via matched_from → old id.
 *
 * Usage: node scripts/restore-variants-63x20.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const VAR = path.join(ROOT, "public", "data", "variants");
const MAV = path.join(ROOT, "public", "mavzuli2");

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 4) + "\n", "utf8");
}

function norm(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[''`ʻʼ‘’]/g, "'")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseOldId(id) {
  const m = String(id).match(/^t_(\d+)_q_(\d+)$/);
  if (!m) return null;
  return { ticket: +m[1], order: +m[2] };
}

function expectedOldIds() {
  const ids = [];
  for (let t = 1; t <= 62; t++) {
    for (let o = 1; o <= 20; o++) ids.push(`t_${t}_q_${o}`);
  }
  for (let o = 1; o <= 10; o++) ids.push(`t_63_q_${o}`);
  return ids;
}

function cloneForOldSlot(q, oldId, newId) {
  const parsed = parseOldId(oldId);
  return {
    task_info: {
      global_id: oldId,
      global_id2: oldId,
      ticket_num: parsed.ticket,
      order: parsed.order,
      // Trace: where this lived in izohlar/new order (optional history)
      remapped_from: newId || null,
    },
    media_url: q.media_url ?? null,
    content: JSON.parse(JSON.stringify(q.content)),
    izoh: JSON.parse(JSON.stringify(q.izoh || { uz_lat: "", uz_cyr: "", ru: "" })),
  };
}

// ── load current bank ─────────────────────────────────────────────
const current = [];
for (let i = 1; i <= 70; i++) {
  const p = path.join(VAR, `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) current.push(q);
}

const byMf = new Map(); // oldId → question (first wins)
const extras = []; // duplicate mf seconds
for (const q of current) {
  const mf = q.task_info?.matched_from;
  if (!mf) {
    extras.push(q);
    continue;
  }
  if (byMf.has(mf)) extras.push(q);
  else byMf.set(mf, q);
}

const expected = expectedOldIds();
const missing = expected.filter((id) => !byMf.has(id));

console.log("current qs:", current.length);
console.log("unique matched_from:", byMf.size);
console.log("extras (dups/orphan):", extras.length);
console.log("missing old slots:", missing.length, missing);

if (extras.length !== missing.length) {
  console.error(
    "Cannot restore cleanly: extras",
    extras.length,
    "!= missing",
    missing.length
  );
  process.exit(1);
}

// Fill missing with extras (stable order)
missing.forEach((oldId, i) => {
  byMf.set(oldId, extras[i]);
  console.log(
    "fill",
    oldId,
    "<-",
    extras[i].task_info.global_id,
    extras[i].content.uz_lat.text.slice(0, 50)
  );
});

// Build tickets
const tickets = new Map();
for (const oldId of expected) {
  const src = byMf.get(oldId);
  if (!src) {
    console.error("still missing", oldId);
    process.exit(1);
  }
  const newId = src.task_info.global_id;
  const out = cloneForOldSlot(src, oldId, newId);
  const t = out.task_info.ticket_num;
  if (!tickets.has(t)) tickets.set(t, []);
  tickets.get(t).push(out);
}

for (const [t, arr] of tickets) {
  arr.sort((a, b) => a.task_info.order - b.task_info.order);
  const expectLen = t === 63 ? 10 : 20;
  if (arr.length !== expectLen) {
    console.error("ticket", t, "has", arr.length, "expected", expectLen);
    process.exit(1);
  }
}

// Write variants: wipe then write v1..v63
for (let i = 1; i <= 70; i++) {
  const p = path.join(VAR, `v${i}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

const allRestored = [];
for (let t = 1; t <= 63; t++) {
  const arr = tickets.get(t);
  saveJson(path.join(VAR, `v${t}.json`), arr);
  allRestored.push(...arr);
}
console.log("Wrote v1..v63, total", allRestored.length);

// barcha + splits + 600
saveJson(path.join(ROOT, "public", "barcha.json"), allRestored);
saveJson(
  path.join(ROOT, "public", "barcha-uz-lat.json"),
  allRestored.map((q) => ({
    task_info: q.task_info,
    media_url: q.media_url,
    content: { uz_lat: q.content.uz_lat },
    izoh: { uz_lat: q.izoh?.uz_lat || "" },
  }))
);
saveJson(
  path.join(ROOT, "public", "barcha-uz-cyr.json"),
  allRestored.map((q) => ({
    task_info: q.task_info,
    media_url: q.media_url,
    content: { uz_cyr: q.content.uz_cyr },
    izoh: { uz_cyr: q.izoh?.uz_cyr || "" },
  }))
);
saveJson(
  path.join(ROOT, "public", "barcha-ru.json"),
  allRestored.map((q) => ({
    task_info: q.task_info,
    media_url: q.media_url,
    content: { ru: q.content.ru },
    izoh: { ru: q.izoh?.ru || "" },
  }))
);
saveJson(path.join(ROOT, "public", "600.json"), allRestored);
console.log("Wrote barcha* + 600.json");

// Index for mavzuli sync
const byGid = new Map(allRestored.map((q) => [q.task_info.global_id, q]));
const byText = new Map();
const byMedia = new Map();
for (const q of allRestored) {
  const t = norm(q.content?.uz_lat?.text);
  if (t) {
    if (!byText.has(t)) byText.set(t, []);
    byText.get(t).push(q);
  }
  const m = (q.media_url || "").trim();
  if (m) {
    if (!byMedia.has(m)) byMedia.set(m, []);
    byMedia.get(m).push(q);
  }
}

function softSim(a, b) {
  const A = new Set(a.split(" ").filter((w) => w.length > 2));
  const B = new Set(b.split(" ").filter((w) => w.length > 2));
  if (!A.size || !B.size) return 0;
  let i = 0;
  for (const w of A) if (B.has(w)) i++;
  return i / Math.max(A.size, B.size);
}

function resolveMav(q) {
  const gid = q.task_info?.global_id;
  const text = norm(q.content?.uz_lat?.text);
  const media = (q.media_url || "").trim();

  if (gid && byGid.has(gid)) {
    const src = byGid.get(gid);
    if (norm(src.content?.uz_lat?.text) === text) return src;
  }

  // remapped_from on mavzuli? or matched_from pointing to new — try reverse via remapped_from values
  // also: mavzuli may still have NEW ids
  for (const src of allRestored) {
    if (src.task_info.remapped_from === gid) return src;
  }

  if (text) {
    const hits = byText.get(text) || [];
    if (hits.length === 1) return hits[0];
    if (hits.length > 1) {
      const cKey = (q.content?.uz_lat?.options || [])
        .filter((o) => o.is_correct)
        .map((o) => norm(o.text))
        .sort()
        .join("|");
      const hit = hits.find((s) => {
        const k = (s.content?.uz_lat?.options || [])
          .filter((o) => o.is_correct)
          .map((o) => norm(o.text))
          .sort()
          .join("|");
        return k === cKey;
      });
      if (hit) return hit;
    }
  }

  if (media) {
    const hits = byMedia.get(media) || [];
    if (hits.length === 1) return hits[0];
  }

  if (text && text.length > 20) {
    let best = { s: 0, q: null };
    for (const cand of allRestored) {
      const s = softSim(text, norm(cand.content?.uz_lat?.text));
      if (s > best.s) best = { s, q: cand };
    }
    if (best.q && best.s >= 0.72) return best.q;
  }
  return null;
}

let mavSynced = 0;
let mavOk = 0;
let mavFail = 0;
const failSamples = [];

for (const name of fs.readdirSync(MAV).filter((f) => f.endsWith(".json"))) {
  const fp = path.join(MAV, name);
  const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
  let changed = false;
  for (const q of arr) {
    const order = q.task_info?.order;
    const src = resolveMav(q);
    if (!src) {
      mavFail++;
      if (failSamples.length < 15) {
        failSamples.push({
          file: name,
          gid: q.task_info?.global_id,
          q: (q.content?.uz_lat?.text || "").slice(0, 55),
        });
      }
      continue;
    }
    const same =
      q.task_info?.global_id === src.task_info.global_id &&
      norm(q.content?.uz_lat?.text) === norm(src.content?.uz_lat?.text) &&
      (q.media_url || "") === (src.media_url || "");
    if (same && q.task_info?.global_id2 === src.task_info.global_id) {
      // still refresh task_info shape
      q.task_info = { ...src.task_info, order };
      changed = true;
      mavOk++;
      continue;
    }
    q.task_info = { ...src.task_info, order };
    q.content = JSON.parse(JSON.stringify(src.content));
    q.media_url = src.media_url ?? null;
    q.izoh = JSON.parse(JSON.stringify(src.izoh || {}));
    changed = true;
    mavSynced++;
  }
  if (changed) saveJson(fp, arr);
}

console.log("mavzuli synced", mavSynced, "meta-refresh", mavOk, "fail", mavFail);
if (failSamples.length) console.log("fail samples", failSamples);

// Verify sizes
for (let t = 1; t <= 63; t++) {
  const n = JSON.parse(fs.readFileSync(path.join(VAR, `v${t}.json`), "utf8")).length;
  const exp = t === 63 ? 10 : 20;
  if (n !== exp) console.error("BAD SIZE", t, n);
}
console.log("OK: 62×20 + 63×10");
