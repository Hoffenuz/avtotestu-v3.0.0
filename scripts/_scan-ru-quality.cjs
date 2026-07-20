/**
 * Scan RU quality issues in variants (izoh.ru + content.ru).
 */
const fs = require("fs");
const path = require("path");

const PATTERNS = [
  { id: "zakon_dd", re: /Закон[ае]?\s+о\s+дорожном\s+движении/i, sev: "medium", note: "ПДД o‘rniga «Закон о ДД»" },
  { id: "obshih_pravil", re: /Общих\s+правил/i, sev: "medium", note: "«Общих правил»" },
  { id: "konstituc", re: /Конституци/i, sev: "high", note: "Конституция (huquqiy chiqindi)" },
  { id: "nacional_admin", re: /Национальн\w*\s+администрац/i, sev: "medium", note: "Noto‘g‘ri tashkilot" },
  { id: "marshrutizator", re: /[Мм]аршрутизатор|[Рр]оутер/i, sev: "high", note: "yo‘naltirgich → маршрутизатор/роутер" },
  { id: "vodo_prud", re: /водян\w*\s+пруд|акваплан(?!ирован)/i, sev: "high", note: "аквапланирование xato" },
  { id: "trotuar_cover", re: /тротуаром/i, sev: "low", note: "«тротуаром» (ko‘pincha покрытие kerak)" },
  { id: "okonchanie_raschet", re: /Окончание\s+расчет/i, sev: "high", note: "aholi punkti oxiri" },
  { id: "dvizhenie_navstrechu", re: /Движение\s+навстречу/i, sev: "high", note: "4.1.1 to‘g‘riga emas" },
  { id: "prava_obgon", re: /права\s+на\s+обгон/i, sev: "medium", note: "imtiyoz ≠ обгон" },
  { id: "vpravo_vpravo", re: /вправо\s+и\s+вправо|направо\s+и\s+направо/i, sev: "high", note: "takror yo‘nalish" },
  { id: "bez_koles", re: /без\s+кол[её]с/i, sev: "high", note: "«без колёс» bema’ni" },
  { id: "obitaemyi", re: /обитаем\w*\s+шлагбаум/i, sev: "high", note: "boshqariladigan shlagbaum" },
  { id: "zelenyi_marsh", re: /Зелен\w*\s+(маршрутизатор|роутер)/i, sev: "high", note: "yashil yo‘naltirgich" },
  { id: "parkovka_parkovka", re: /парковать\s+и\s+парковать/i, sev: "medium", note: "takror «парковать»" },
  { id: "obgon_obgon", re: /обгон[ае]?,?\s+обгон/i, sev: "medium", note: "takror обгон" },
  { id: "vysadka_vysadka", re: /высадк\w+\s+или\s+высадк/i, sev: "medium", note: "chiqarish/tushirish chalkash" },
  { id: "rul_koleso", re: /рулевым\s+колесом|неработающим\s+рулевым/i, sev: "medium", note: "rul boshqaruvi" },
  { id: "kpr", re: /\bКПР\b/i, sev: "medium", note: "КПР chiqindi" },
  { id: "yhq_in_ru", re: /\bYHQ\b/, sev: "low", note: "RU da YHQ qolgan" },
  { id: "proselochn", re: /проселочн/i, sev: "low", note: "«проселочную» (ko‘pincha yon yo‘l)" },
  { id: "koncess", re: /знаков\s+концессии/i, sev: "high", note: "полоса/уступки emas" },
  { id: "tolkanie", re: /\bтолк(ание|ать|уш)/i, sev: "medium", note: "занос o‘rniga толчок?" },
  { id: "zapiranie", re: /запирани/i, sev: "high", note: "shatak emas запирание" },
  { id: "avtomagistral_wrong", re: /На\s+автомобильных\s+дорогах\s+запрещается/i, sev: "medium", note: "avtomagistral chalkashi?" },
];

const hits = [];
const byPat = {};

for (let i = 1; i <= 63; i++) {
  const p = path.join("public/data/variants", `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
    const id = q.task_info?.global_id;
    const parts = [
      ["izoh", q.izoh?.ru || ""],
      ["q", q.content?.ru?.text || ""],
      ...((q.content?.ru?.options || []).map((o, idx) => [`opt${idx + 1}`, o.text || ""])),
    ];
    for (const [where, text] of parts) {
      if (!text) continue;
      for (const pat of PATTERNS) {
        if (pat.re.test(text)) {
          byPat[pat.id] = (byPat[pat.id] || 0) + 1;
          hits.push({
            id,
            where,
            pat: pat.id,
            sev: pat.sev,
            note: pat.note,
            snip: text.replace(/\s+/g, " ").slice(0, 140),
          });
        }
      }
    }
  }
}

const uniqQ = new Set(hits.map((h) => h.id));
const high = hits.filter((h) => h.sev === "high");
const med = hits.filter((h) => h.sev === "medium");

console.log("=== RU quality scan ===");
console.log("pattern hits (rows):", hits.length);
console.log("unique questions touched:", uniqQ.size, "/ ~1250");
console.log("high severity rows:", high.length, "unique Q:", new Set(high.map((h) => h.id)).size);
console.log("medium severity rows:", med.length, "unique Q:", new Set(med.map((h) => h.id)).size);
console.log("\nBy pattern:");
for (const [k, v] of Object.entries(byPat).sort((a, b) => b[1] - a[1])) {
  const meta = PATTERNS.find((p) => p.id === k);
  console.log(`  ${v}\t${k}\t(${meta.sev}) ${meta.note}`);
}

console.log("\n=== HIGH samples ===");
const seen = new Set();
for (const h of high) {
  if (seen.has(h.id + h.pat)) continue;
  seen.add(h.id + h.pat);
  console.log(`${h.id} [${h.pat}] ${h.where}: ${h.snip}`);
  if (seen.size >= 25) break;
}

fs.writeFileSync(
  "scripts/_ru-quality-scan.json",
  JSON.stringify({ byPat, hits: hits.slice(0, 500), uniq: uniqQ.size }, null, 2)
);
