const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let empty = 0;
let total = 0;
for (const f of fs.readdirSync(path.join(ROOT, "public/data/variants")).filter((x) => /^v\d+\.json$/.test(x))) {
  for (const q of JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/variants", f), "utf8"))) {
    if (!q.izoh) continue;
    total++;
    if (!q.izoh.ru || !String(q.izoh.ru).trim()) {
      empty++;
      console.log("empty", q.task_info.global_id, f);
    }
  }
}
const b = JSON.parse(fs.readFileSync(path.join(ROOT, "public/barcha.json"), "utf8"));
const bEmpty = b.filter((q) => q.izoh && !String(q.izoh.ru || "").trim()).length;
console.log(JSON.stringify({ total, empty, barchaRuEmpty: bEmpty }, null, 2));
