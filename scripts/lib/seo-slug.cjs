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

module.exports = { slugify, signSlug, extractSignCodes };
