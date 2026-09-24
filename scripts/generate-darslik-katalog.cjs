#!/usr/bin/env node
/**
 * Darslik katalogini yaratadi: src/data/darslikKatalog.ts
 *
 * NEGA GENERATOR, QO'LDA EMAS:
 *   Video fayllari R2 da yo'l belgisi KODI bilan nomlangan ("5.10.2-5.10.3.mp4").
 *   Ilgari shu kod foydalanuvchiga dars nomi sifatida ko'rsatilardi — ya'ni
 *   odam "5.10.2-5.10.3" degan ro'yxatni ko'rib, nima o'rganishini bilmasdi.
 *   Bu skript kodni `public/data/belgilar.json` dagi HAQIQIY belgi nomiga
 *   aylantiradi (uchala tilda) — ya'ni nomlar qo'lda ko'chirilmaydi va
 *   belgilar bazasi yangilansa, darslik nomlari ham o'zi yangilanadi.
 *
 * YANGI VIDEO QO'SHISH:
 *   1. Videoni R2 ga yuklang.
 *   2. `src/data/darslik-videos.json` ga URL ni qo'shing (bo'limi ichiga).
 *   3. `npm run darslik:build`
 *   Belgi bo'lmagan dars bo'lsa — nomini `src/data/darslik-titles.json` ga
 *   qo'shing, aks holda skript XATO bilan to'xtaydi va qaysi dars nomsiz
 *   qolganini aytadi.
 *
 * Manbalar:
 *   src/data/darslik-videos.json  — bo'limlar va video URL lari (qo'lda yuritiladi)
 *   src/data/darslik-titles.json  — belgi bo'lmagan darslar nomi (qo'lda yuritiladi)
 *   public/data/belgilar.json     — belgilar nomlari (savollar bazasi bilan bitta manba)
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const VIDEOS = path.join(ROOT, "src/data/darslik-videos.json");
const TITLES = path.join(ROOT, "src/data/darslik-titles.json");
const SIGNS = path.join(ROOT, "public/data/belgilar.json");
const OUT = path.join(ROOT, "src/data/darslikKatalog.ts");

/**
 * Video bo'limi -> `belgilar.json` dagi guruh indeksi.
 *
 * DIQQAT — BU JADVAL XAVFSIZLIK UCHUN: "Yo'l chiziqlari" bo'limidagi
 * fayllar ham "1.1", "1.4" kabi nomlangan, LEKIN ular chiziq kodlari,
 * belgi kodlari emas. Agar qidiruv bo'limga bog'lanmasa, "1.1-chiziq"
 * "Shlagbaumli temir yo'l kesishmasi" degan belgiga aylanib ketardi —
 * imtihonga tayyorlanayotgan odam uchun bu jiddiy xato.
 */
const SIGN_GROUP_BY_CHAPTER = {
  "Ogohlantiruvchi belgilar": 0,
  "Imtiyoz belgilari": 1,
  "Taqiqlovchi belgilar": 2,
  "Buyuruvchi belgilar": 3,
  "Axborot-ko'rsatkich belgilari": 4,
  "Servis belgilari": 5,
  "Qo'shimcha axborot belgilari": 6,
};

/** Belgi bo'lmagan bo'limlarning turi va uchala tildagi nomi. */
const OTHER_CHAPTERS = {
  "Umumiy qoidalar": {
    kind: "terms",
    title: { uz_lat: "Umumiy qoidalar", uz_cyr: "Умумий қоидалар", ru: "Общие положения" },
  },
  "Yo'l chiziqlari": {
    kind: "markings",
    title: { uz_lat: "Yo'l chiziqlari", uz_cyr: "Йўл чизиқлари", ru: "Дорожная разметка" },
  },
  "Haydovchining huquqiy javobgarligi": {
    kind: "law",
    title: {
      uz_lat: "Haydovchining huquqiy javobgarligi",
      uz_cyr: "Ҳайдовчининг ҳуқуқий жавобгарлиги",
      ru: "Правовая ответственность водителя",
    },
  },
  "Yo'l harakati sohasidagi qonunchilik asoslari": {
    kind: "law",
    title: {
      uz_lat: "Yo'l harakati sohasidagi qonunchilik asoslari",
      uz_cyr: "Йўл ҳаракати соҳасидаги қонунчилик асослари",
      ru: "Основы законодательства в сфере дорожного движения",
    },
  },
};

const LANGS = ["uz_lat", "uz_cyr", "ru"];

function slug(value) {
  return value
    .toLowerCase()
    .replace(/['`’]/g, "")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fileNameOf(url) {
  return decodeURIComponent(url.split("/").pop() || "").replace(/\.mp4$/i, "");
}

/** Sarlavhadan kod prefiksini olib tashlaydi: "1.1 Shlagbaumli..." -> "Shlagbaumli...". */
function stripCode(title) {
  return String(title).replace(/^\s*[\d.]+(\s*[,\-–]\s*[\d.]+)*\s*/, "").trim();
}

function capitalize(value) {
  return value ? value[0].toLocaleUpperCase("uz") + value.slice(1) : value;
}

/**
 * Fayl nomini kodlarga ajratadi.
 * "5.17.1-5.17.4"      -> ["5.17.1", "5.17.4"]
 * "5.16.1, 5.16.2"     -> ["5.16.1", "5.16.2"]
 * "4.1.1-4.1.6 davomi" -> ["4.1.1", "4.1.6"] + davomi bayrog'i
 */
function parseCodes(fileName) {
  const davomi = /\s*davomi\s*$/i.test(fileName);
  const base = fileName.replace(/\s*davomi\s*$/i, "").trim();
  if (!/^[\d]/.test(base)) return { davomi, codes: [] };
  const codes = base.split(/\s*[,\-–]\s*/).map((s) => s.trim()).filter(Boolean);
  return { davomi, codes };
}

/** Bir nechta belgi nomini bitta o'qiladigan sarlavhaga birlashtiradi. */
function joinNames(names) {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length === 0) return "";
  if (unique.length === 1) return capitalize(unique[0]);
  return capitalize(unique.slice(0, 2).join(" · ")) + (unique.length > 2 ? " …" : "");
}

/**
 * Kodni raqamli tartiblash kaliti: "1.10" > "1.9" bo'lishi uchun.
 *
 * Oddiy matn tartibida "1.10" "1.2" dan OLDIN kelardi va darslar
 * 1.1 -> 1.10 -> 1.11 -> 1.2 ko'rinishida chiqardi — o'rganayotgan odam
 * uchun bu chalkash tartib edi. Kodsiz darslar (atamalar) alifbo
 * bo'yicha, kodlilardan KEYIN turadi.
 */
function sortKey(code) {
  if (!code) return null;
  const first = code.split(/\s*[,\-–]\s*/)[0].trim();
  return first.split(".").map((part) => Number(part) || 0);
}

function compareLessons(a, b) {
  const ka = sortKey(a.code);
  const kb = sortKey(b.code);
  if (ka && kb) {
    const len = Math.max(ka.length, kb.length);
    for (let i = 0; i < len; i += 1) {
      const diff = (ka[i] ?? 0) - (kb[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }
  if (ka) return -1;
  if (kb) return 1;
  return a.title.uz_lat.localeCompare(b.title.uz_lat, "uz");
}

function main() {
  const chapters = JSON.parse(fs.readFileSync(VIDEOS, "utf8"));
  const titles = JSON.parse(fs.readFileSync(TITLES, "utf8"));
  const signGroups = JSON.parse(fs.readFileSync(SIGNS, "utf8"));
  const fileFixes = titles.fileNameFixes || {};

  // Guruh indeksi -> (kod -> uchala tildagi nom)
  const signsByGroup = signGroups.map((group) => {
    const map = new Map();
    for (const item of group.items || []) {
      if (!item.code) continue;
      map.set(item.code, {
        uz_lat: stripCode(item.title.uz_lat),
        uz_cyr: stripCode(item.title.uz_cyr),
        ru: stripCode(item.title.ru),
      });
    }
    return map;
  });

  const problems = [];
  const pending = [];
  const modules = [];

  for (const { chapter, videos } of chapters) {
    const signGroupIndex = SIGN_GROUP_BY_CHAPTER[chapter];
    const other = OTHER_CHAPTERS[chapter];

    if (signGroupIndex === undefined && !other) {
      problems.push(`"${chapter}" bo'limi na belgi guruhiga, na OTHER_CHAPTERS ga bog'langan`);
      continue;
    }

    const moduleId = slug(chapter);
    const kind = other ? other.kind : "signs";
    /*
      Modul nomi belgilar bazasidan olinadi — ikki joyda ayri yozilmasin.
      `moduleTitles` esa faqat SHU joy uchun ustun qo'yiladigan tuzatish:
      belgilar bazasidagi ba'zi guruh nomlari grammatik jihatdan noto'g'ri
      ("Imtiyozli belgilari"), lekin u faylni bu yerdan o'zgartirish
      savollar bazasiga ham tegib ketardi.
    */
    const override = (titles.moduleTitles || {})[chapter];
    const moduleTitle = override
      ? override
      : other
        ? other.title
        : {
            uz_lat: signGroups[signGroupIndex].title.uz_lat,
            uz_cyr: signGroups[signGroupIndex].title.uz_cyr,
            ru: signGroups[signGroupIndex].title.ru,
          };

    const lessons = [];
    const seenIds = new Set();

    for (const url of videos) {
      const rawName = fileNameOf(url);
      const fileName = fileFixes[rawName] || rawName;
      const { davomi, codes } = parseCodes(rawName);

      let code = null;
      let title = null;

      if (kind === "signs") {
        const lookup = signsByGroup[signGroupIndex];
        const found = codes.map((c) => lookup.get(c)).filter(Boolean);
        if (found.length === 0) {
          problems.push(`${chapter}: "${rawName}" kodi belgilar guruhida topilmadi`);
          continue;
        }
        // Fayldagi ASL yozuv saqlanadi: "4.1.1-4.1.6" oraliq bo'lib qolsin.
        // `codes.join(", ")` uni ikkita alohida kodga o'xshatib qo'yardi.
        code = rawName.replace(/\s*davomi\s*$/i, "").trim();
        title = {};
        for (const lang of LANGS) title[lang] = joinNames(found.map((f) => f[lang]));
        if (davomi) {
          title.uz_lat += " (davomi)";
          title.uz_cyr += " (давоми)";
          title.ru += " (продолжение)";
        }
      } else if (kind === "terms") {
        const entry = (titles[chapter] || {})[fileName];
        if (!entry) {
          problems.push(`${chapter}: "${fileName}" uchun nom darslik-titles.json da yo'q`);
          continue;
        }
        title = { uz_lat: entry.uz_lat, uz_cyr: entry.uz_cyr, ru: entry.ru };
      } else if (kind === "markings") {
        /*
          Chiziqlarning MATNLI nomi hali yo'q: `belgilar.json` da faqat
          belgilar bor, chiziqlar yo'q. Kodni belgidek talqin qilish ochiq
          xato bo'lardi ("1.1-chiziq" != "1.1-belgi"), shuning uchun
          shu yerda faqat kod TO'G'RI belgilanadi va ro'yxat pastda
          "nom kutilmoqda" deb chiqariladi.
        */
        const entry = (titles[chapter] || {})[fileName];
        code = fileName;
        if (entry) {
          title = { uz_lat: entry.uz_lat, uz_cyr: entry.uz_cyr, ru: entry.ru };
        } else {
          pending.push(`${chapter}: ${fileName}`);
          title = {
            uz_lat: `${fileName}-chiziq`,
            uz_cyr: `${fileName}-чизиқ`,
            ru: `Разметка ${fileName}`,
          };
        }
      } else {
        const entry = (titles[chapter] || {})[fileName];
        if (entry) {
          title = { uz_lat: entry.uz_lat, uz_cyr: entry.uz_cyr, ru: entry.ru };
        } else {
          pending.push(`${chapter}: ${fileName}`);
          title = {
            uz_lat: `${fileName}-qism`,
            uz_cyr: `${fileName}-қисм`,
            ru: `Часть ${fileName}`,
          };
        }
      }

      // Barqaror id: fayl nomidan olinadi, tartib raqamidan EMAS. Yangi
      // video o'rtaga qo'shilsa, qolgan darslarning "ko'rildi" belgisi
      // boshqa darsga surilib ketmasin.
      let id = `${moduleId}/${slug(fileName)}`;
      if (seenIds.has(id)) {
        let n = 2;
        while (seenIds.has(`${id}-${n}`)) n += 1;
        id = `${id}-${n}`;
      }
      seenIds.add(id);

      lessons.push({ id, code, title, url });
    }

    lessons.sort(compareLessons);
    modules.push({ id: moduleId, kind, title: moduleTitle, lessons });
  }

  if (problems.length) {
    console.error("\n[darslik] TUZATILISHI SHART:");
    for (const p of problems) console.error("  - " + p);
    process.exit(1);
  }

  const total = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const banner = `// AVTOMATIK YARATILGAN FAYL — QO'LDA TAHRIRLAMANG.
//
// Manba:   src/data/darslik-videos.json, src/data/darslik-titles.json,
//          public/data/belgilar.json
// Yangilash: npm run darslik:build
//
// Dars nomlari belgilar bazasidan olinadi, ya'ni video fayl "5.10.2-5.10.3.mp4"
// deb nomlangan bo'lsa ham foydalanuvchi belgining haqiqiy nomini ko'radi.
`;

  const body = `${banner}
export type DarslikLangText = { uz_lat: string; uz_cyr: string; ru: string };

/** Modul mazmuni — UI ikonkasi va kod belgisi shunga qarab tanlanadi. */
export type DarslikModuleKind = "terms" | "signs" | "markings" | "law";

export interface DarslikLesson {
  /** Barqaror id — "ko'rildi" belgisi shu bo'yicha saqlanadi. */
  id: string;
  /** Yo'l belgisi yoki chiziq kodi; atama darslarida \`null\`. */
  code: string | null;
  title: DarslikLangText;
  url: string;
}

export interface DarslikModule {
  id: string;
  kind: DarslikModuleKind;
  title: DarslikLangText;
  lessons: readonly DarslikLesson[];
}

export const DARSLIK_MODULES: readonly DarslikModule[] = ${JSON.stringify(modules, null, 2)};

/** Jami dars soni — progress hisoblashda ishlatiladi. */
export const DARSLIK_TOTAL_LESSONS = ${total};
`;

  fs.writeFileSync(OUT, body, "utf8");

  console.log(`[darslik] ${modules.length} modul, ${total} dars -> src/data/darslikKatalog.ts`);
  if (pending.length) {
    console.log(`\n[darslik] ${pending.length} ta darsning nomi hali yo'q (kod ko'rsatiladi):`);
    for (const p of pending) console.log("  - " + p);
    console.log("  Nomlarni src/data/darslik-titles.json ga qo'shing.");
  }
}

main();
