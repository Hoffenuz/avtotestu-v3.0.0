const fs = require("fs");
const path = require("path");
const { toCyrillic } = require("./uz-translit.cjs");

const ROOT = path.join(__dirname, "..");

function fixCyr(lat) {
  const P0 = "\uE000";
  const P1 = "\uE001";
  const P2 = "\uE002";
  let s = (lat || "")
    .replace(/\bYHQning\b/g, P2)
    .replace(/\bYHQga\b/g, P1)
    .replace(/\bYHQ\b/g, P0);
  let cyr = toCyrillic(s);
  cyr = cyr
    .replace(new RegExp(P2, "g"), "YHQнинг")
    .replace(new RegExp(P1, "g"), "YHQга")
    .replace(new RegExp(P0, "g"), "YHQ")
    .replace(/@@YHQ@@/g, "YHQ")
    .replace(/<<<ЙҲҚ>>>/g, "YHQ")
    .replace(/ЙҲҚ/g, "YHQ");
  return cyr;
}

function applyFile(p) {
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!Array.isArray(d)) return 0;
  let n = 0;
  for (const q of d) {
    if (q.izoh?.uz_lat) {
      const fixed = fixCyr(q.izoh.uz_lat);
      if (q.izoh.uz_cyr !== fixed) {
        q.izoh.uz_cyr = fixed;
        n++;
      }
    }
  }
  fs.writeFileSync(p, JSON.stringify(d, null, 4) + "\n");
  return n;
}

let n = 0;
for (let i = 1; i <= 63; i++) {
  n += applyFile(path.join(ROOT, "public/data/variants", `v${i}.json`));
}
n += applyFile(path.join(ROOT, "public/barcha.json"));
for (const f of fs.readdirSync(path.join(ROOT, "public/mavzuli2")).filter((x) => x.endsWith(".json"))) {
  n += applyFile(path.join(ROOT, "public/mavzuli2", f));
}

const barcha = JSON.parse(fs.readFileSync(path.join(ROOT, "public/barcha.json"), "utf8"));
const make = (langKey) =>
  barcha.map((q) => {
    const lang = q.content?.[langKey] || q.content?.uz_lat;
    return {
      task_info: q.task_info,
      media_url: q.media_url || "",
      content: {
        [langKey]: { text: lang?.text || "", options: lang?.options || [] },
      },
      izoh: { [langKey]: q.izoh?.[langKey] || q.izoh?.uz_lat || "" },
    };
  });

fs.writeFileSync(path.join(ROOT, "public/barcha-uz-lat.json"), JSON.stringify(make("uz_lat"), null, 4) + "\n");
fs.writeFileSync(path.join(ROOT, "public/barcha-uz-cyr.json"), JSON.stringify(make("uz_cyr"), null, 4) + "\n");
fs.writeFileSync(path.join(ROOT, "public/barcha-ru.json"), JSON.stringify(make("ru"), null, 4) + "\n");

console.log("test:", fixCyr("YHQ 3-ilovasi YHQga asosan YHQning bandi"));
console.log("updated", n);
console.log("sample", barcha[0].izoh.uz_cyr.slice(0, 90));
