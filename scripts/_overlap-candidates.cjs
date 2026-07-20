/**
 * Reading aid: soft keyword overlap between question+answer and izoh.
 * Low overlap + media/sign questions → candidates for manual review.
 */
const fs = require("fs");
const from = Number(process.argv[2] || 1);
const to = Number(process.argv[3] || 63);

function soft(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[''`ʻʼ]/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(s) {
  return soft(s)
    .split(" ")
    .filter((w) => w.length >= 4);
}

function overlapRatio(a, b) {
  const A = new Set(words(a));
  const B = new Set(words(b));
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const x of A) if (B.has(x)) n++;
  return n / Math.min(A.size, 12);
}

const cands = [];
for (let v = from; v <= to; v++) {
  for (const q of JSON.parse(
    fs.readFileSync(`public/data/variants/v${v}.json`, "utf8")
  )) {
    const id = q.task_info.global_id;
    const text = q.content.uz_lat.text || "";
    const ans = q.content.uz_lat.options.find((o) => o.is_correct)?.text || "";
    const iz = q.izoh?.uz_lat || "";
    const qa = text + " " + ans;
    const r = overlapRatio(qa, iz);
    // only flag very low overlap with non-trivial texts
    if (r < 0.08 && words(qa).length >= 6 && words(iz).length >= 8) {
      cands.push({
        id,
        r: Number(r.toFixed(3)),
        Q: text.slice(0, 100),
        A: ans.slice(0, 80),
        IZ: iz.slice(0, 120),
      });
    }
  }
}
cands.sort((a, b) => a.r - b.r);
console.log(JSON.stringify(cands.slice(0, 80), null, 2));
console.log("total_low_overlap", cands.length);
