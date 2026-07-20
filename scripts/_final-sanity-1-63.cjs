const fs = require("fs");
const path = require("path");

const ids = ["t_31_q_2", "t_51_q_9", "t_60_q_13"];
const byId = new Map();
for (const id of ids) {
  const m = id.match(/t_(\d+)_q_/);
  const arr = JSON.parse(fs.readFileSync(path.join("public/data/variants", `v${m[1]}.json`), "utf8"));
  const q = arr.find((x) => x.task_info.global_id === id);
  byId.set(id, q);
  console.log(id, "=>", (q.izoh.ru || "").slice(0, 160));
}

for (const name of ["barcha.json", "barcha-ru.json"]) {
  const bp = path.join("public", name);
  const arr = JSON.parse(fs.readFileSync(bp, "utf8"));
  let n = 0;
  for (const q of arr) {
    const src = byId.get(q.task_info?.global_id);
    if (!src) continue;
    if (name === "barcha.json") {
      q.content.ru = JSON.parse(JSON.stringify(src.content.ru));
      q.izoh = { ...src.izoh };
    } else {
      q.content.ru = {
        text: src.content.ru.text,
        options: JSON.parse(JSON.stringify(src.content.ru.options)),
      };
      q.izoh = { ru: src.izoh?.ru || "" };
    }
    n++;
  }
  fs.writeFileSync(bp, JSON.stringify(arr, null, 4) + "\n", "utf8");
  console.log("synced", name, n);
}

function soft(s) {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}
function hasDup(opts) {
  const t = (opts || []).map((o) => soft(o.text));
  return t.some((x, i) => x && t.indexOf(x) !== i);
}

let ruDups = 0,
  emptyRu = 0,
  bad = [];
for (let i = 1; i <= 63; i++) {
  for (const q of JSON.parse(fs.readFileSync(path.join("public/data/variants", `v${i}.json`), "utf8"))) {
    if (hasDup(q.content?.ru?.options)) {
      ruDups++;
      bad.push("dup:" + q.task_info.global_id);
    }
    if (!(q.izoh?.ru || "").trim()) emptyRu++;
    if (/МПК|Уголовн|Гражданский кодекс|РКИК ООН|к ООН|Глава \d+ ООН|о гражданском процессе/i.test(q.izoh?.ru || "")) {
      bad.push("legal:" + q.task_info.global_id);
    }
  }
}
console.log({ ruDups, emptyRu, bad });
