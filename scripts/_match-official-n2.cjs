const fs = require("fs");
const path = require("path");

const NROOT =
  "C:/Users/Vosster PC/Desktop/projects/maktabavto-v3.0.0/public/data";
const VROOT = path.join(__dirname, "..", "public", "data", "variants");

function soft(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u02BB\u02BC'`]/g, "")
    .replace(/mototsikl/g, "motosikl")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const bySoft = new Map();
for (let i = 1; i <= 63; i++) {
  const n = JSON.parse(fs.readFileSync(path.join(NROOT, `n${i}.json`), "utf8"));
  for (const q of n.data.questions) {
    const text = (q.body.find((b) => b.type === 1) || {}).value || "";
    const s = soft(text);
    if (!bySoft.has(s)) bySoft.set(s, []);
    bySoft.get(s).push({
      t: i,
      id: q.id,
      izoh: q.answer_description || "",
      text,
    });
  }
}

let exact = 0;
let miss = 0;
for (let i = 1; i <= 63; i++) {
  for (const q of JSON.parse(
    fs.readFileSync(path.join(VROOT, `v${i}.json`), "utf8")
  )) {
    if (bySoft.has(soft(q.content.uz_lat.text))) exact++;
    else miss++;
  }
}
console.log({ exact, miss, matchPct: ((exact / (exact + miss)) * 100).toFixed(1) });

const bad = [
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
  "t_7_q_18",
  "t_1_q_17",
  "t_9_q_14",
];

for (const id of bad) {
  const t = id.split("_")[1];
  const q = JSON.parse(
    fs.readFileSync(path.join(VROOT, `v${t}.json`), "utf8")
  ).find((x) => x.task_info.global_id === id);
  const s = soft(q.content.uz_lat.text);
  const hit = bySoft.get(s);
  console.log(
    id,
    hit
      ? `HIT n${hit[0].t} id=${hit[0].id} izLen=${hit[0].izoh.length}`
      : "MISS",
    "|",
    q.content.uz_lat.text.slice(0, 70)
  );
  if (hit) {
    console.log("  OFF:", hit[0].izoh.slice(0, 140) || "(empty)");
    console.log("  LOC:", (q.izoh?.uz_lat || "").slice(0, 140));
  }
}

// How many matched have different izoh (non-empty official)?
let diff = 0;
let same = 0;
let offEmpty = 0;
const diffs = [];
for (let i = 1; i <= 63; i++) {
  for (const q of JSON.parse(
    fs.readFileSync(path.join(VROOT, `v${i}.json`), "utf8")
  )) {
    const hit = bySoft.get(soft(q.content.uz_lat.text));
    if (!hit) continue;
    const off = (hit[0].izoh || "").trim();
    const loc = (q.izoh?.uz_lat || "").trim();
    if (!off) {
      offEmpty++;
      continue;
    }
    if (soft(off) === soft(loc)) same++;
    else {
      diff++;
      if (diffs.length < 15) {
        diffs.push({
          id: q.task_info.global_id,
          loc: loc.slice(0, 80),
          off: off.slice(0, 80),
        });
      }
    }
  }
}
console.log({ same, diff, offEmptyWhenMatched: offEmpty });
console.log("diff samples", JSON.stringify(diffs, null, 2));
