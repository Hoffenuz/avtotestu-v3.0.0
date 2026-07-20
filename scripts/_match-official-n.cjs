const fs = require("fs");
const path = require("path");

const NROOT =
  "C:/Users/Vosster PC/Desktop/projects/maktabavto-v3.0.0/public/data";
const VROOT = path.join(
  __dirname,
  "..",
  "public",
  "data",
  "variants"
);

function soft(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[''`ʻʼ‘’]/g, "")
    .replace(/o[ʻ']/g, "o")
    .replace(/g[ʻ']/g, "g")
    .replace(/[^a-z0-9\u0400-\u04FF]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mediaKey(m) {
  const b = String(m || "")
    .split("/")
    .pop()
    .toLowerCase();
  return b
    .replace(/\.(webp|png|jpg|jpeg)$/i, "")
    .replace(/-\d+-\d+$/, "")
    .replace(/uz$/, "");
}

const bySoft = new Map();
const byMedia = new Map();
let nTotal = 0;

for (let i = 1; i <= 63; i++) {
  const n = JSON.parse(fs.readFileSync(path.join(NROOT, `n${i}.json`), "utf8"));
  for (const q of n.data.questions) {
    nTotal++;
    const text = (q.body.find((b) => b.type === 1) || {}).value || "";
    const img = (q.body.find((b) => b.type === 2) || {}).value || "";
    const entry = {
      ticket: i,
      id: q.id,
      text,
      izoh: q.answer_description || "",
      media: img,
    };
    const s = soft(text);
    if (s) {
      if (!bySoft.has(s)) bySoft.set(s, []);
      bySoft.get(s).push(entry);
    }
    const mk = mediaKey(img);
    if (mk && mk.length > 3) {
      if (!byMedia.has(mk)) byMedia.set(mk, []);
      byMedia.get(mk).push(entry);
    }
  }
}

console.log({ nTotal, softKeys: bySoft.size, mediaKeys: byMedia.size });

let exact = 0;
let mediaOnly = 0;
let miss = 0;
const missSamples = [];

for (let i = 1; i <= 63; i++) {
  const arr = JSON.parse(fs.readFileSync(path.join(VROOT, `v${i}.json`), "utf8"));
  for (const q of arr) {
    const s = soft(q.content.uz_lat.text);
    const mk = mediaKey(q.media_url);
    if (bySoft.has(s)) exact++;
    else if (mk && byMedia.has(mk)) mediaOnly++;
    else {
      miss++;
      if (missSamples.length < 10) {
        missSamples.push({
          id: q.task_info.global_id,
          q: q.content.uz_lat.text.slice(0, 80),
          m: q.media_url || "",
        });
      }
    }
  }
}

console.log({ exact, mediaOnly, miss, missSamples });

// Check known bad izoh IDs against official
const badIds = [
  "t_1_q_9",
  "t_2_q_10",
  "t_2_q_18",
  "t_5_q_14",
  "t_9_q_5",
  "t_11_q_1",
  "t_14_q_9",
  "t_16_q_20",
  "t_21_q_4",
  "t_45_q_17",
  "t_1_q_17",
  "t_7_q_18",
  "t_9_q_4",
  "t_9_q_14",
];

function loadV(id) {
  const t = id.split("_")[1];
  const arr = JSON.parse(fs.readFileSync(path.join(VROOT, `v${t}.json`), "utf8"));
  return arr.find((x) => x.task_info.global_id === id);
}

console.log("\n--- bad ID match to official ---");
for (const id of badIds) {
  const q = loadV(id);
  if (!q) {
    console.log(id, "MISSING");
    continue;
  }
  const s = soft(q.content.uz_lat.text);
  const mk = mediaKey(q.media_url);
  const softHit = bySoft.get(s);
  const mediaHit = mk ? byMedia.get(mk) : null;
  const hit = softHit?.[0] || mediaHit?.[0];
  console.log({
    id,
    via: softHit ? "soft" : mediaHit ? "media" : "NONE",
    localIz: (q.izoh?.uz_lat || "").slice(0, 80),
    offIz: hit ? hit.izoh.slice(0, 100) : "-",
    same: hit ? soft(hit.izoh) === soft(q.izoh?.uz_lat) : false,
  });
}
