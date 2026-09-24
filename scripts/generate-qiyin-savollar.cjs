/**
 * Qiyin savollar bo'limi uchun ma'lumot yaratadi.
 *
 * QIYINLIK NIMADAN OLINADI — faqat HAQIQIY XATOLARDAN.
 *
 * `scripts/data-sources/savol-xatolari.json` — Supabase dagi
 * `user_question_state` ning suratkashi: har bir savol nechta MARTA
 * noto'g'ri javob berilgani.
 *
 * NEGA matndan hisoblanmaydi: matn belgilari bilan haqiqiy xatolar
 * o'rtasidagi bog'liqlik o'lchandi va deyarli yo'q chiqdi (Pearson r):
 *
 *   variantlar o'xshashligi  0.069
 *   raqam bor                0.076
 *   variant soni             0.148   ← eng kuchlisi, u ham kuchsiz
 *   javob uzunligi          -0.058
 *
 * Ya'ni "qiyin ko'rinadigan" savol amalda qiyin bo'lmaydi. Shuning
 * uchun matn belgilari faqat TENG xatoli savollarni saralashda
 * ishlatiladi — tartibni barqaror qilish uchun, bashorat uchun emas.
 *
 * Chiqish: public/data/qiyin-savollar.json
 *   Faqat `global_id` lar — savol matni saqlanmaydi, chunki test
 *   `loadCorpusIndex` orqali korpusdan o'qiladi. Fayl kichik va
 *   uchala til uchun bitta.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

/** Bitta bo'limda shuncha savol. */
const GURUH = 50;

/**
 * Nechta bo'lim yaratiladi.
 *
 * 5 × 50 = 250 savol — korpusning ~20% i. Ilgari 10 bo'lim (500 savol)
 * edi, lekin korpusning YARMINI "qiyin" deb atash ma'nosini yo'qotadi:
 * ro'yxatning oxirida deyarli o'rtacha savollar turardi.
 */
const GURUH_SONI = 5;

const norm = (s) =>
  (s || "").toLowerCase()
    .replace(/[‘’ʻʼ`]/g, "'")
    .replace(/[^\p{L}\p{N}'\s-]/gu, " ")
    .replace(/\s+/g, " ").trim();

const sozlar = (s) =>
  new Set(norm(s).split(" ").filter((w) => w.length >= 4));

/** Ikki to'plam o'xshashligi (Jaccard). */
function jaccard(a, b) {
  const kesishma = [...a].filter((x) => b.has(x)).length;
  const birlashma = new Set([...a, ...b]).size;
  return birlashma ? kesishma / birlashma : 0;
}

// ── Manbalar ─────────────────────────────────────────────────────────────
const A = JSON.parse(fs.readFileSync(path.join(ROOT, "public/barcha.json"), "utf-8"));
const manba = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/data-sources/savol-xatolari.json"), "utf-8"),
);
/*
  `xato` — savol nechta MARTA noto'g'ri javob berilgani (`sum(wrong_count)`),
  `user` — nechta turli foydalanuvchi xato qilgani.

  Saralash va ko'rsatish uchun JAMI XATO olinadi: bitta odam savolni bir
  necha marta chalkashtirsa, bu savolning haqiqatan qiyinligini bildiradi
  va turli-user hisobida bu ma'lumot yo'qoladi. Masalan `t_4_q_8`:
  21 kishi, lekin 62 marta xato.
*/
const XATO = manba.xato;
const USER = manba.user || {};

console.log("📊 Qiyin savollar hisoblanmoqda…");
console.log(`   Manba: ${manba.manba} (${manba.sana})`);
console.log(`   ${Object.keys(XATO).length} savolda xato qayd etilgan\n`);

// ── Saralash ─────────────────────────────────────────────────────────────
const royxat = [];
for (const q of A) {
  const gid = q.task_info.global_id;
  const xato = XATO[gid];
  if (!xato) continue; // xato ma'lumoti yo'q — "qiyin" deb ayta olmaymiz

  const c = q.content?.uz_lat;
  const cor = c?.options?.find((o) => o.is_correct);
  if (!cor) continue;

  // Teng xatoli savollarni saralash uchun ikkilamchi belgilar
  const notogri = c.options.filter((o) => !o.is_correct);
  const cw = sozlar(cor.text);
  const oxshashlik = notogri.length
    ? Math.max(...notogri.map((o) => jaccard(cw, sozlar(o.text))))
    : 0;

  royxat.push({
    id: gid,
    v: q.task_info.ticket_num,
    xato,
    user: USER[gid] ?? 0,
    nOpt: c.options.length,
    oxshashlik,
  });
}

royxat.sort((a, b) =>
  b.xato - a.xato ||               // 1. haqiqiy xatolar
  b.nOpt - a.nOpt ||               // 2. variant soni (r=0.148)
  b.oxshashlik - a.oxshashlik ||   // 3. variantlar o'xshashligi
  a.id.localeCompare(b.id),        // 4. barqaror tartib
);

// ── Guruhlash ────────────────────────────────────────────────────────────
const kerak = GURUH * GURUH_SONI;
if (royxat.length < kerak) {
  console.error(
    `❌ Yetarli savol yo'q: ${royxat.length} ta bor, ${kerak} ta kerak.\n` +
    `   'savol-xatolari.json' ni yangilang yoki GURUH_SONI ni kamaytiring.`,
  );
  process.exit(1);
}

const guruhlar = [];
for (let i = 0; i < GURUH_SONI; i++) {
  const bolak = royxat.slice(i * GURUH, (i + 1) * GURUH);
  guruhlar.push({
    n: i + 1,
    dan: i * GURUH + 1,
    gacha: (i + 1) * GURUH,
    // Guruhning o'rtacha va eng yuqori xatosi — sahifada ko'rsatiladi
    ort: Math.round(bolak.reduce((s, x) => s + x.xato, 0) / bolak.length),
    max: bolak[0].xato,
    min: bolak[bolak.length - 1].xato,
    // Guruhdagi jami xatolar — sahifada shu ko'rsatiladi
    jami: bolak.reduce((s, x) => s + x.xato, 0),
    ids: bolak.map((x) => x.id),
  });
}

const chiqish = {
  sana: manba.sana,
  jamiUser: manba.jami_user,
  guruhSoni: GURUH_SONI,
  guruhHajmi: GURUH,
  guruhlar,
};

const p = path.join(ROOT, "public/data/qiyin-savollar.json");
fs.writeFileSync(p, JSON.stringify(chiqish), "utf-8");

console.log(`  ${GURUH_SONI} ta bo'lim × ${GURUH} savol = ${kerak} savol`);
for (const g of guruhlar) {
  console.log(
    `    ${String(g.dan).padStart(3)}–${String(g.gacha).padEnd(3)} ` +
    `xato: ${String(g.max).padStart(2)}…${String(g.min).padStart(2)} ` +
    `(o'rtacha ${g.ort})`,
  );
}
console.log(`\n✅ ${Math.round(fs.statSync(p).size / 1024)} KB — faqat global_id lar`);
