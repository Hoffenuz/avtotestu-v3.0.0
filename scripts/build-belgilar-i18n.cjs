/**
 * Builds public/data/belgilar.json with uz_lat / uz_cyr / ru titles
 * from scripts/data-sources/belgilar-uzavtoyolbelgi-mirror.html (an offline
 * HTTrack mirror used only as a one-off data source) + official RU names
 * (lex.uz PDD dump).
 *
 * NOTE: this mirror must NEVER live under public/ — it used to sit at
 * public/belgilar/belgilar.html and was being served live to real users at
 * /belgilar/belgilar.html (a scraped copy of a third-party site, bypassing
 * the SPA entirely). Keep it here instead.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HTML_PATH = path.join(
  ROOT,
  "scripts/data-sources/belgilar-uzavtoyolbelgi-mirror.html"
);
const LEX_PATH =
  process.env.LEX_DUMP ||
  path.join(
    process.env.USERPROFILE || "",
    ".cursor/projects/c-Users-Vosster-PC-Desktop-avtotestu-v3-0-0/agent-tools/7297dcbe-5362-4a20-b7a6-4ee0d771a55b.txt"
  );
const OUT_PATH = path.join(ROOT, "public/data/belgilar.json");

function decodeHtml(s) {
  return String(s || "")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Uzbek Latin → Cyrillic (approximate, good enough for UI labels) */
function latToCyr(input) {
  let s = decodeHtml(input);
  // Normalize apostrophe variants used in Uzbek Latin
  s = s.replace(/[ʼʻ`´]/g, "'");

  const digraphs = [
    ["O'", "Ў"],
    ["o'", "ў"],
    ["G'", "Ғ"],
    ["g'", "ғ"],
    ["Sh", "Ш"],
    ["sh", "ш"],
    ["Ch", "Ч"],
    ["ch", "ч"],
    ["Ng", "Нг"],
    ["ng", "нг"],
    ["Ya", "Я"],
    ["ya", "я"],
    ["Yo", "Ё"],
    ["yo", "ё"],
    ["Yu", "Ю"],
    ["yu", "ю"],
    ["Ye", "Е"],
    ["ye", "е"],
    ["Ts", "Ц"],
    ["ts", "ц"],
  ];
  for (const [a, b] of digraphs) s = s.split(a).join(b);

  const map = {
    A: "А",
    a: "а",
    B: "Б",
    b: "б",
    D: "Д",
    d: "д",
    E: "Е",
    e: "е",
    F: "Ф",
    f: "ф",
    G: "Г",
    g: "г",
    H: "Ҳ",
    h: "ҳ",
    I: "И",
    i: "и",
    J: "Ж",
    j: "ж",
    K: "К",
    k: "к",
    L: "Л",
    l: "л",
    M: "М",
    m: "м",
    N: "Н",
    n: "н",
    O: "О",
    o: "о",
    P: "П",
    p: "п",
    Q: "Қ",
    q: "қ",
    R: "Р",
    r: "р",
    S: "С",
    s: "с",
    T: "Т",
    t: "т",
    U: "У",
    u: "у",
    V: "В",
    v: "в",
    X: "Х",
    x: "х",
    Y: "Й",
    y: "й",
    Z: "З",
    z: "з",
    "'": "",
  };
  return [...s].map((ch) => (map[ch] !== undefined ? map[ch] : ch)).join("");
}

function extractCode(title) {
  const m = decodeHtml(title).match(/^(\d+(?:\.\d+){1,3})/);
  return m ? m[1].replace(/\.$/, "") : null;
}

function parseGroupsFromHtml(html) {
  const sequence = [];
  const parts = html.split(/(?=<div class="categories-header|<div class="dez-box)/);
  for (const p of parts) {
    if (p.includes("categories-header")) {
      const t = p.match(/<strong>([^<]+)<\/strong>/);
      if (t) sequence.push({ type: "cat", title: decodeHtml(t[1]) });
    } else if (p.includes("dez-box")) {
      const img = p.match(/src="([^"]+)"/);
      const name = p.match(/id="prodname"[^>]*>([^<]*)</);
      const titleAttr = p.match(/title="([^"]+)"/);
      if (img) {
        const file = img[1].split("/").pop();
        sequence.push({
          type: "sign",
          file,
          title: decodeHtml(name ? name[1] : titleAttr ? titleAttr[1] : file),
        });
      }
    }
  }
  const seen = new Set();
  const out = [];
  let cur = null;
  for (const s of sequence) {
    if (s.type === "cat") {
      cur = { title: s.title, items: [] };
      out.push(cur);
    } else if (s.type === "sign" && cur) {
      if (seen.has(s.file)) continue;
      seen.add(s.file);
      cur.items.push({ file: s.file, title: s.title });
    }
  }
  return out;
}

function expandCodeList(prefix) {
  // "1.11.1, 1.11.2" | "1.4.1 — 1.4.6" | "4.9.1, 4.9.2 и 4.9.3" | "5.8.7. 5.8.8"
  const codes = [];
  const range = prefix.match(
    /^(\d+(?:\.\d+){1,2})\.(\d+)\s*[—–\-]\s*\1\.(\d+)$/
  );
  if (range) {
    const base = range[1];
    for (let i = Number(range[2]); i <= Number(range[3]); i++) {
      codes.push(`${base}.${i}`);
    }
    return codes;
  }
  const parts = prefix.split(/\s*(?:,|\sи\s)\s*|\.\s+(?=\d)/);
  for (let p of parts) {
    p = p.replace(/\.$/, "").trim();
    if (/^\d+(?:\.\d+){1,3}$/.test(p)) codes.push(p);
  }
  return codes;
}

function parseRuNamesFromLex(text) {
  const map = Object.create(null);
  // Lines: 1.1. «Name».  | 1.11.1, 1.11.2. «Name».  | 1.4.1 — 1.4.6. «Name».
  const re =
    /^((?:\d+(?:\.\d+){1,3})(?:\s*(?:,|\sи\s|[—–\-])\s*(?:\d+(?:\.\d+){1,3})|\.\s+(?:\d+(?:\.\d+){1,3}))*)\.?\s*[«"]([^»"]+)[»"]/gm;

  let m;
  while ((m = re.exec(text))) {
    const name = m[2].trim().replace(/\.$/, "");
    const codes = expandCodeList(m[1].replace(/\.$/, "").trim());
    for (const c of codes) map[c] = name;
  }

  // Also catch unquoted titles: 6.17. Отдел внутренних дел.
  const re2 = /^(\d+(?:\.\d+){1,3})\.\s+([А-ЯЁA-Z][^.\n]{2,80})\.?$/gm;
  while ((m = re2.exec(text))) {
    const code = m[1];
    if (!map[code]) map[code] = m[2].trim();
  }

  return map;
}

const GROUP_I18N = {
  "Ogohlantiruvchi belgilar": {
    uz_lat: "Ogohlantiruvchi belgilar",
    uz_cyr: "Огоҳлантирувчи белгилар",
    ru: "Предупреждающие знаки",
  },
  "Imtiyozli belgilari": {
    uz_lat: "Imtiyozli belgilari",
    uz_cyr: "Имтиёзли белгилари",
    ru: "Знаки приоритета",
  },
  "Ta'qiqlovchi belgilar": {
    uz_lat: "Ta'qiqlovchi belgilar",
    uz_cyr: "Тақиқловчи белгилар",
    ru: "Запрещающие знаки",
  },
  "Buyuruvchi belgilar": {
    uz_lat: "Buyuruvchi belgilar",
    uz_cyr: "Буюрувчи белгилар",
    ru: "Предписывающие знаки",
  },
  "Axborot-ishora belgilari": {
    uz_lat: "Axborot-ishora belgilari",
    uz_cyr: "Ахборот-ишора белгилари",
    ru: "Информационно-указательные знаки",
  },
  "Servis belgilari": {
    uz_lat: "Servis belgilari",
    uz_cyr: "Сервис белгилари",
    ru: "Знаки сервиса",
  },
  "Qo'shimcha axborot belgilari": {
    uz_lat: "Qo'shimcha axborot belgilari",
    uz_cyr: "Қўшимча ахборот белгилари",
    ru: "Знаки дополнительной информации",
  },
};

/** Manual RU overrides / aliases where catalog numbering differs from lex dump */
const RU_OVERRIDE = {
  "1.3": "Внимание «УЗП»",
  "1.25": "Дикие животные",
  "4.10": "Дорожка для всадников",
  "5.8.9": "Число полос",
  "5.10.2": "Выезд на дорогу с полосой для маршрутных транспортных средств",
  "5.10.3": "Выезд на дорогу с полосой для маршрутных транспортных средств",
  "6.3": "Автозаправочная станция",
  "6.17": "Полиция",
  "7.19": "Камера на перекрестке",
  "7.20": "Опасный груз",
  "7.21": "Эвакуатор работает",
  "7.21.1": "Вид маршрутного транспортного средства",
  "7.21.2": "Вид маршрутного транспортного средства",
  "7.21.3": "Вид маршрутного транспортного средства",
};

function formatTitle(code, name) {
  if (!code) return name;
  // Keep spacing style consistent: "1.1 Name"
  return `${code} ${name}`.replace(/\s+/g, " ").trim();
}

function stripCode(title) {
  return decodeHtml(title)
    .replace(/^(\d+(?:\.\d+){1,3})\.?\s*[–—\-]?\s*/, "")
    .trim();
}

function main() {
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const groups = parseGroupsFromHtml(html);

  let ruMap = Object.create(null);
  if (fs.existsSync(LEX_PATH)) {
    ruMap = parseRuNamesFromLex(fs.readFileSync(LEX_PATH, "utf8"));
    console.log("Loaded RU names from lex dump:", Object.keys(ruMap).length);
  } else {
    console.warn("Lex dump not found, using overrides + Latin fallback for RU");
  }
  Object.assign(ruMap, RU_OVERRIDE);

  const result = groups.map((g) => {
    const groupTitle =
      GROUP_I18N[g.title] || {
        uz_lat: g.title,
        uz_cyr: latToCyr(g.title),
        ru: g.title,
      };

    const items = g.items.map((item) => {
      const code = extractCode(item.title);
      const nameLat = stripCode(item.title) || item.title;
      const uz_lat = formatTitle(code, nameLat);
      const uz_cyr = formatTitle(code, latToCyr(nameLat));

      let ruName = null;
      if (code) {
        ruName =
          ruMap[code] ||
          ruMap[code.replace(/\.0+$/, "")] ||
          null;
        // try parent like 5.8.2 when only 5.8 exists — no
      }
      if (!ruName && !code) {
        // untitled extras e.g. "To'siq"
        if (/to['']?siq/i.test(nameLat)) ruName = "Препятствие";
      }
      const ru = formatTitle(code, ruName || nameLat);

      return {
        src: "/belgilar/" + item.file,
        code: code || null,
        title: { uz_lat, uz_cyr, ru },
      };
    });

    return { title: groupTitle, items };
  });

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), "utf8");

  const total = result.reduce((a, g) => a + g.items.length, 0);
  const missingRu = [];
  for (const g of result) {
    for (const it of g.items) {
      const code = it.code;
      const ruBody = stripCode(it.title.ru);
      const latBody = stripCode(it.title.uz_lat);
      // Heuristic: if RU equals Latin (no cyrillic letters), mark missing
      if (!/[А-Яа-яЁё]/.test(ruBody) && /[A-Za-z]/.test(latBody)) {
        missingRu.push(it.title.uz_lat);
      }
    }
  }
  console.log("Wrote", OUT_PATH);
  console.log("Groups:", result.length, "Signs:", total);
  console.log("Missing RU (latin leftover):", missingRu.length);
  if (missingRu.length) console.log(missingRu.slice(0, 40).join("\n"));
}

main();
