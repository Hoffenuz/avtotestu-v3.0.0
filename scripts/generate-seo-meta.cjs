/**
 * Til bo'yicha meta teglar jadvali — `functions/_seo-meta.ts`.
 *
 * MUAMMO: `/ru/belgilar` va `/cyr/belgilar` manzillari SPA `index.html` ni
 * oladi, uning meta teglari esa O'ZBEKCHA (lotin). JavaScript yuklangach
 * Helmet ularni to'g'rilaydi, lekin JS ishlatmaydigan o'quvchilar —
 * Telegram, Facebook va boshqa ijtimoiy tarmoq botlari — o'sha o'zbekcha
 * matnni ko'radi. Natijada ruscha havola ulashilganda preview o'zbekcha
 * chiqadi.
 *
 * YECHIM: Cloudflare middleware HTML javobini uzatayotganda meta teglarni
 * manzilning tiliga moslab almashtiradi. Buning uchun unga kichik jadval
 * kerak — shu fayl o'sha jadvalni yasaydi.
 *
 * MANBA — SAHIFALARNING O'ZI: yo'l (`path`) va tarjima kaliti (`seo.X`)
 * `src/pages/*.tsx` dan o'qiladi, qo'lda ikkinchi ro'yxat yuritilmaydi.
 * Aks holda sahifa yo'li o'zgarganda jadval jimgina eskirib qolardi.
 *
 * Ishga tushirish: node scripts/generate-seo-meta.cjs  (prebuild ichida)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PAGES_DIR = path.join(ROOT, "src/pages");
const OUT = path.join(ROOT, "functions/_seo-meta.ts");

const LOCALES = {
  "uz-lat": path.join(ROOT, "src/locales/uz-lat.json"),
  uz: path.join(ROOT, "src/locales/uz.json"),
  ru: path.join(ROOT, "src/locales/ru.json"),
};

/** `a.b.c` ko'rinishidagi kalitni obyektdan oladi. */
function olish(obj, kalit) {
  let joriy = obj;
  for (const qism of kalit.split(".")) {
    if (joriy && typeof joriy === "object" && qism in joriy) joriy = joriy[qism];
    else return null;
  }
  return typeof joriy === "string" ? joriy : null;
}

/**
 * Sahifalardan yo'l va tarjima kalitlarini yig'adi.
 *
 * Har maydon ALOHIDA o'qiladi, chunki saytda ikki xil kalit nomlash
 * uchraydi: yangi sahifalar `seo.variant.title`, eskiroqlari esa
 * `home.seoTitle` ko'rinishida. Kalitni `title` kalitidan kelib chiqib
 * TAXMIN QILSAK, bosh sahifa jadvaldan tushib qolardi — u esa eng ko'p
 * trafik oladigan sahifa.
 *
 * `noIndex` sahifalar o'tkazib yuboriladi: ularning meta tegi qidiruvga
 * ham, ulashishga ham tushmaydi.
 */
function sahifalarniOqish() {
  const juftlar = [];

  for (const fayl of fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith(".tsx"))) {
    const matn = fs.readFileSync(path.join(PAGES_DIR, fayl), "utf-8");
    const blok = matn.match(/<SEO[\s\S]*?\/>/);
    if (!blok) continue;

    const ichi = blok[0];
    if (/noIndex/.test(ichi)) continue;

    const yolMos = ichi.match(/path="([^"]*)"/);
    if (!yolMos) continue;

    const kalit = (maydon) => {
      const m = ichi.match(new RegExp(maydon + '=\\{t\\("([^"]+)"\\)\\}'));
      return m ? m[1] : null;
    };

    const titleKalit = kalit("title");
    const descKalit = kalit("description");
    // Matni qattiq kodlangan sahifa jadvalga kirmaydi: uni tilga
    // moslashtirib bo'lmaydi.
    if (!titleKalit || !descKalit) continue;

    juftlar.push({
      yol: yolMos[1],
      titleKalit,
      descKalit,
      keywordsKalit: kalit("keywords"),
      fayl,
    });
  }

  return juftlar;
}

function main() {
  const tarjimalar = {};
  for (const [til, yol] of Object.entries(LOCALES)) {
    tarjimalar[til] = JSON.parse(fs.readFileSync(yol, "utf-8"));
  }

  const juftlar = sahifalarniOqish();
  if (juftlar.length === 0) {
    console.error("❌ generate-seo-meta: birorta sahifa topilmadi");
    process.exit(1);
  }

  /** yol → { til → {title, description, keywords} } */
  const jadval = {};
  const yetishmayotgan = [];

  for (const { yol, titleKalit, descKalit, keywordsKalit, fayl } of juftlar) {
    jadval[yol] = {};
    for (const til of Object.keys(LOCALES)) {
      const title = olish(tarjimalar[til], titleKalit);
      const description = olish(tarjimalar[til], descKalit);
      const keywords = keywordsKalit ? olish(tarjimalar[til], keywordsKalit) : null;
      if (!title || !description) {
        yetishmayotgan.push(`${fayl}: ${!title ? titleKalit : descKalit} (${til})`);
        continue;
      }
      jadval[yol][til] = { title, description, keywords: keywords || "" };
    }
  }

  if (yetishmayotgan.length) {
    console.error("❌ generate-seo-meta: tarjima yetishmaydi:");
    for (const q of yetishmayotgan) console.error("   " + q);
    process.exit(1);
  }

  const chiqish = `/**
 * AVTOMATIK YASALGAN — QO'LDA TAHRIRLAMANG.
 * Manba: src/pages/*.tsx (yo'l va kalit) + src/locales/*.json (matn).
 * Qayta yasash: node scripts/generate-seo-meta.cjs
 */

export interface SeoMeta {
  title: string;
  description: string;
  keywords: string;
}

/** Yo'l (til prefiksisiz) → til → meta. */
export const SEO_META: Record<string, Record<string, SeoMeta>> = ${JSON.stringify(jadval, null, 2)};
`;

  fs.writeFileSync(OUT, chiqish, "utf-8");
  console.log(
    `✅ _seo-meta.ts: ${Object.keys(jadval).length} sahifa × ${Object.keys(LOCALES).length} til`,
  );
}

main();
