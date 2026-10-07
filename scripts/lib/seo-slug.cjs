/**
 * SEO manzillari uchun umumiy slug mantiqi.
 *
 * NEGA ALOHIDA MODUL: savol va belgi generatorlari bir-birining
 * manzillariga havola qo'yadi. Agar slug qoidasi ikki faylda alohida
 * yozilsa, birini o'zgartirib ikkinchisini unutish — barcha ichki
 * havolalarni jimgina buzadi.
 */

/** Matndan barqaror slug. Bir xil matn HAR DOIM bir xil slug beradi. */
function slugify(text, fallback) {
  let s = String(text || "")
    .toLowerCase()
    .replace(/o[''`ʻʼ]/g, "o")
    .replace(/g[''`ʻʼ]/g, "g")
    .replace(/[''`ʻʼ«»""]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);

  if (!s || s.length < 8) return fallback;
  return s;
}

/**
 * Yo'l belgisi manzili: `1.3.1` + "Shlagbaumsiz temir yo'l kesishmasi"
 * → `1-3-1-shlagbaumsiz-temir-yol-kesishmasi`
 *
 * Kod boshida turadi — u noyob va barqaror, ya'ni nom tahrirlansa ham
 * manzil tanib olinadigan bo'lib qoladi.
 */
function signSlug(code, title) {
  const codePart = String(code || "").replace(/\./g, "-");
  // Nomda kod takrorlanadi ("1.1 Shlagbaumli...") — uni olib tashlaymiz.
  const cleanTitle = String(title || "").replace(/^\s*[\d.]+\s*/, "");
  const titlePart = slugify(cleanTitle, "");
  const slug = titlePart ? `${codePart}-${titlePart}` : codePart;
  return slug.slice(0, 80).replace(/-+$/, "");
}

/** Belgi kodlarini matndan ajratadi: "3.24 va 3.25 belgilari" → ["3.24","3.25"] */
function extractSignCodes(text, knownCodes) {
  const found = String(text || "").match(/\b\d{1,2}\.\d{1,2}(?:\.\d{1,2})?\b/g) || [];
  const uniq = [...new Set(found)];
  return knownCodes ? uniq.filter((c) => knownCodes.has(c)) : uniq;
}

/** Taqqoslash uchun: kichik harf, barcha turdagi apostroflar bitta, belgilarsiz. */
function normalizeName(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[‘’ʻʼ`´]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * So'zning "tomiri": birinchi 5 harf. "qayrilib" va "qayrilish" bir xil
 * tomirga ega, shuning uchun nomlar biroz boshqacha yozilgan bo'lsa ham
 * (YHQ matni va katalogda) mos deb topiladi.
 */
function stemOf(word) {
  return word.length > 5 ? word.slice(0, 5) : word;
}

/** Ikki nomdagi umumiy so'z tomirlari ulushi (qisqaroq nomga nisbatan), 0..1. */
function nameOverlap(a, b) {
  const stems = (s) =>
    new Set(normalizeName(s).split(" ").filter((w) => w.length > 2).map(stemOf));
  const A = stems(a);
  const B = stems(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const w of A) if (B.has(w)) common++;
  return common / Math.min(A.size, B.size);
}

/** `3.27 «To'xtash taqiqlangan»` — kod va qo'shtirnoqdagi nomi birga. */
const CODE_NAME_RE =
  /(?<![\d.])(\d{1,2}(?:\.\d{1,2}){1,2})(?!\d|\.\d)[\s.:,—–-]{0,3}["«“„]\s*([^"«»“”„]{3,70}?)\s*["»”“]/;

/**
 * Izohdagi HAQIQIY yo'l belgisi eslatmalarini topadi.
 *
 * NEGA `extractSignCodes` YETARLI EMAS: u izohdagi har qanday "3.1" ni
 * belgi deb oladi. Aslida bunday raqam ko'pincha boshqa narsa: YHQ
 * bandi ("3.1-bandiga"), yo'l chizig'i ("1.1 chizig'i") yoki ro'yxat.
 * Natijada "3.1 Kirish taqiqlangan" sahifasida tuman faralari haqidagi
 * savol chiqib qolardi.
 *
 * Belgi eslatmasi izohda NOMI bilan keladi: `3.27 «To'xtash taqiqlangan»`.
 * Kod faqat yonidagi qo'shtirnoqdagi nom shu belgining nomiga mos
 * kelsagina qabul qilinadi.
 *
 * @param {string} text izoh matni
 * @param {Map<string,{title:string}>} signMap kod -> belgi (title: kodsiz nom)
 */
function extractNamedSignCodes(text, signMap) {
  const found = new Set();
  const re = new RegExp(CODE_NAME_RE.source, "g");
  let m;
  while ((m = re.exec(String(text || "")))) {
    const sign = signMap.get(m[1]);
    if (sign && nameOverlap(m[2], sign.title) >= 0.6) found.add(m[1]);
  }
  return [...found];
}

module.exports = { slugify, signSlug, extractSignCodes, extractNamedSignCodes, nameOverlap };
