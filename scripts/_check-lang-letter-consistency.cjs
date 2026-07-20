const fs = require("fs");
const path = require("path");

const LATIN_ABC_MEDIA = {
  // verified Latin A/B/C (or A/B) on image → all langs must use Latin letters
  "u311uz.webp": "t_28_q_8",
  "u317uz.webp": "t_28_q_14",
  "u156uz.webp": "t_14_q_9",
  "u529uz.webp": "t_46_q_8",
  "u656uz.webp": "t_57_q_5",
  "u623uz.webp": "t_54_q_9",
};

function loadQ(id) {
  const m = id.match(/^t_(\d+)/);
  const arr = JSON.parse(
    fs.readFileSync(path.join("public/data/variants", `v${m[1]}.json`), "utf8")
  );
  return arr.find((x) => x.task_info.global_id === id);
}

function hasCyrLetterLabel(text) {
  return /[АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ]/.test(text || "");
}

for (const [media, id] of Object.entries(LATIN_ABC_MEDIA)) {
  const q = loadQ(id);
  console.log("\n===", id, media, "===");
  for (const L of ["uz_lat", "uz_cyr", "ru"]) {
    const opts = q.content[L].options.map((o) => ({
      t: o.text,
      c: o.is_correct,
      cyr: hasCyrLetterLabel(o.text),
    }));
    console.log(
      L,
      opts.map((o) => (o.c ? "*" : "") + o.t + (o.cyr ? " [CYR!]" : "")).join(" | ")
    );
  }
}

// Scan ALL variants: if LAT options use only Latin A/B/C/V/S/G letters
// but CYR/RU still have Cyrillic А/Б/В for short letter options → report
console.log("\n=== cross-lang letter alphabet mismatches ===");
let n = 0;
for (let i = 1; i <= 63; i++) {
  const p = path.join("public/data/variants", `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
    const lat = q.content?.uz_lat?.options || [];
    const cyr = q.content?.uz_cyr?.options || [];
    const ru = q.content?.ru?.options || [];
    const latJoined = lat.map((o) => o.text).join(" ");
    const looksLatinLabels =
      /\b[ABCGVS]\b/.test(latJoined) &&
      !hasCyrLetterLabel(latJoined) &&
      lat.some((o) => /^[«\"]?[ABCGVS][»\"]?(\s|$|va|и|,)/i.test(o.text.trim()) || /^(A|B|C|G|V|S)(\sva\s|\sи\s|,)/i.test(o.text) || /Faqat [ABCGVS]|Только [ABCGVS]|A va |B va |A и /i.test(o.text));
    if (!looksLatinLabels) continue;
    const cyrHas = cyr.some((o) => hasCyrLetterLabel(o.text));
    const ruHas = ru.some((o) => hasCyrLetterLabel(o.text));
    if (cyrHas || ruHas) {
      n++;
      console.log(
        q.task_info.global_id,
        q.media_url,
        "LAT:",
        lat.map((o) => o.text).join(" / "),
        "| CYR:",
        cyr.map((o) => o.text).join(" / "),
        "| RU:",
        ru.map((o) => o.text).join(" / ")
      );
    }
  }
}
console.log("count", n);
