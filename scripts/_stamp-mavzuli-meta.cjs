/**
 * Second pass: stamp matched_from/global_id2 on mavzuli from variants by gid or text.
 * Fix remaining unresolved if soft-match finds a source.
 */
const fs = require("fs");
const path = require("path");

const VAR = path.join("public/data/variants");
const MAV = path.join("public/mavzuli2");

function norm(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[''`ʻʼ‘’]/g, "'")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadNew() {
  const byGid = new Map();
  const byText = new Map();
  for (let i = 1; i <= 66; i++) {
    const p = path.join(VAR, `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
      byGid.set(q.task_info.global_id, q);
      const t = norm(q.content?.uz_lat?.text);
      if (t) {
        if (!byText.has(t)) byText.set(t, []);
        byText.get(t).push(q);
      }
    }
  }
  return { byGid, byText };
}

const { byGid, byText } = loadNew();
let stamped = 0;
let unresolved = [];

for (const name of fs.readdirSync(MAV).filter((f) => f.endsWith(".json"))) {
  const fp = path.join(MAV, name);
  const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
  let changed = false;
  for (const q of arr) {
    const order = q.task_info?.order;
    let src = byGid.get(q.task_info?.global_id);
    const qt = norm(q.content?.uz_lat?.text);
    if (!src || norm(src.content?.uz_lat?.text) !== qt) {
      const hits = byText.get(qt) || [];
      if (hits.length === 1) src = hits[0];
      else src = null;
    }
    if (!src) {
      unresolved.push({ file: name, gid: q.task_info?.global_id, q: (q.content?.uz_lat?.text || "").slice(0, 60) });
      continue;
    }
    const ti = {
      global_id: src.task_info.global_id,
      global_id2: src.task_info.global_id2 || src.task_info.global_id,
      ticket_num: src.task_info.ticket_num,
      order: order,
      matched_from: src.task_info.matched_from || null,
    };
    const needMeta =
      q.task_info?.global_id !== ti.global_id ||
      q.task_info?.global_id2 !== ti.global_id2 ||
      q.task_info?.matched_from !== ti.matched_from;
    const needBody =
      JSON.stringify(q.content) !== JSON.stringify(src.content) ||
      (q.media_url || "") !== (src.media_url || "") ||
      JSON.stringify(q.izoh) !== JSON.stringify(src.izoh);

    if (needMeta || needBody) {
      q.task_info = ti;
      if (needBody) {
        q.content = JSON.parse(JSON.stringify(src.content));
        q.media_url = src.media_url ?? null;
        q.izoh = JSON.parse(JSON.stringify(src.izoh || {}));
      }
      changed = true;
      stamped++;
    }
  }
  if (changed) {
    fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
    console.log("updated", name);
  }
}

console.log("stamped/fixed", stamped);
console.log("still unresolved", unresolved.length, unresolved);
