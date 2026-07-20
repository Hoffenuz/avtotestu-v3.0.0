/**
 * Final RU polish pass for remaining clear MT artifacts.
 * Syncs changed izoh.ru / content.ru to barcha* + mavzuli2.
 */
const fs = require("fs");
const path = require("path");

const VAR = path.join("public", "data", "variants");

function polish(text) {
  if (!text) return text;
  let t = text;
  // svetofor: «дополнительная сеть» → секция
  t = t.replace(/дополнительн(ой|ая|ую|ые|ых)\s+сети/gi, (_, a) => {
    const map = {
      ой: "ой секции",
      ая: "ая секция",
      ую: "ую секцию",
      ые: "ые секции",
      ых: "ых секций",
    };
    // careful - we already consumed "сети"
    return "дополнительн" + a + " " + (map[a]?.split(" ").pop() || "секции");
  });
  // simpler explicit replacements
  t = t.replace(/дополнительной сети/gi, "дополнительной секции");
  t = t.replace(/дополнительная сеть/gi, "дополнительная секция");
  t = t.replace(/дополнительную сеть/gi, "дополнительную секцию");
  t = t.replace(/дополнительной сетью/gi, "дополнительной секцией");
  t = t.replace(/этой сетью/gi, "этой секцией");
  t = t.replace(/этой сети/gi, "этой секции");
  t = t.replace(/регулируемом этой сетью/gi, "регулируемом этой секцией");
  t = t.replace(/регулируемом этой сети/gi, "регулируемом этой секцией");

  t = t.replace(/по ленте/gi, "по полосе");
  t = t.replace(/движения по ленте/gi, "движения по полосе");

  t = t.replace(/обитаем(ый|ого|ому|ым|ом)\s+шлагбаум/gi, "регулируемый шлагбаум");
  t = t.replace(/обитаемого шлагбаума/gi, "регулируемого шлагбаума");
  t = t.replace(/обитаемому шлагбауму/gi, "регулируемому шлагбауму");

  t = t.replace(/не горящими или не горящими/gi, "негорящими (не включёнными)");
  t = t.replace(/не горящими\s+или\s+не\s+горящими/gi, "негорящими");

  // «также разрешает поворот» after left-turn arrow in light context → разворот (common MT bug)
  t = t.replace(
    /(разрешающ\w+\s+поворот\s+налево[^.]{0,80}?также разрешает\s+)поворот/gi,
    "$1разворот"
  );

  t = t.replace(/знаков концессии/gi, "знаков приоритета");
  t = t.replace(/Закон[ае]?\s+о\s+дорожном\s+движении/gi, "ПДД");
  t = t.replace(/на автомобильных дорогах запрещается/gi, "на автомагистралях запрещается");
  t = t.replace(/На автомобильных дорогах запрещается/g, "На автомагистралях запрещается");

  // awkward «трафик» in PDD context
  t = t.replace(/требованиям к трафику/gi, "требованиям к порядку движения");
  t = t.replace(/что трафик в направлении/gi, "что движение в направлении");
  t = t.replace(/означает, что трафик/gi, "означает, что движение");

  return t;
}

const changed = new Set();
let fieldHits = 0;

for (let i = 1; i <= 63; i++) {
  const p = path.join(VAR, `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  const arr = JSON.parse(fs.readFileSync(p, "utf8"));
  let fileCh = false;
  for (const q of arr) {
    let qCh = false;
    const apply = (obj, key) => {
      if (!obj || typeof obj[key] !== "string") return;
      const next = polish(obj[key]);
      if (next !== obj[key]) {
        obj[key] = next;
        fieldHits++;
        qCh = true;
      }
    };
    apply(q.izoh, "ru");
    apply(q.content?.ru, "text");
    for (const o of q.content?.ru?.options || []) apply(o, "text");
    if (qCh) {
      changed.add(q.task_info.global_id);
      fileCh = true;
    }
  }
  if (fileCh) fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n");
}

console.log("fields patched:", fieldHits, "questions:", changed.size);

const byId = new Map();
for (let i = 1; i <= 63; i++) {
  const p = path.join(VAR, `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
    byId.set(q.task_info.global_id, q);
  }
}

function sync(rel, fn) {
  const fp = path.join("public", rel);
  if (!fs.existsSync(fp)) return 0;
  const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
  let n = 0;
  for (const q of arr) {
    if (!changed.has(q.task_info?.global_id)) continue;
    const src = byId.get(q.task_info.global_id);
    if (!src) continue;
    fn(q, src);
    n++;
  }
  fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
  return n;
}

console.log(
  "barcha",
  sync("barcha.json", (q, s) => {
    q.izoh.ru = s.izoh.ru;
    if (q.content?.ru) q.content.ru = JSON.parse(JSON.stringify(s.content.ru));
  })
);
console.log(
  "600",
  sync("600.json", (q, s) => {
    q.izoh.ru = s.izoh.ru;
    if (q.content?.ru) q.content.ru = JSON.parse(JSON.stringify(s.content.ru));
  })
);
console.log(
  "barcha-ru",
  sync("barcha-ru.json", (q, s) => {
    q.izoh.ru = s.izoh.ru;
    if (q.content?.ru) q.content.ru = JSON.parse(JSON.stringify(s.content.ru));
  })
);

let mav = 0;
for (const name of fs.readdirSync("public/mavzuli2").filter((f) => f.endsWith(".json"))) {
  const fp = path.join("public/mavzuli2", name);
  const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
  let ch = false;
  for (const q of arr) {
    if (!changed.has(q.task_info?.global_id)) continue;
    const src = byId.get(q.task_info.global_id);
    if (!src) continue;
    q.izoh.ru = src.izoh.ru;
    if (q.content?.ru) q.content.ru = JSON.parse(JSON.stringify(src.content.ru));
    ch = true;
    mav++;
  }
  if (ch) fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
}
console.log("mavzuli", mav);

// verify leftovers
const leftovers = [];
const re =
  /дополнительн\w+\s+сети|по ленте|обитаем\w+\s+шлагбаум|не горящими или не горящими|знаков концессии|Закон[ае]?\s+о\s+дорожном|маршрутизатор|запиран|без\s+кол[её]с/i;
for (const q of byId.values()) {
  const blob = [q.izoh?.ru, q.content?.ru?.text, ...(q.content?.ru?.options || []).map((o) => o.text)]
    .filter(Boolean)
    .join("\n");
  if (re.test(blob)) leftovers.push(q.task_info.global_id);
}
console.log("leftover hard patterns:", leftovers.length, leftovers.slice(0, 15));
