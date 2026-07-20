/**
 * Build verified letter mismatch list (image vs uz_lat options).
 * Based on manual CDN image inspection 2026-07-20.
 */
const fs = require("fs");
const path = require("path");

const CDN = "https://www.avtotestu.uz/images/";
const LOCAL = "scripts/_img-check/";

/** Verified by reading images */
const VERIFIED = [
  {
    id: "t_28_q_8",
    media: "u311uz.webp",
    rasm: "Latin A B C",
    opts: "Hammasi | A va V | Faqat A",
    muammo: "Rasmda B, matnda V → «A va V» noto‘g‘ri",
    severity: "CONFIRMED",
  },
  {
    id: "t_28_q_14",
    media: "u317uz.webp",
    rasm: "Latin A B C (+ yo‘lda katta A — bekat chizig‘i)",
    opts: "«Б» | Hech qaysi | «А» | «В»",
    muammo: "Rasm Latin A/B/C, javob kirill; «В» ≠ C",
    severity: "CONFIRMED",
  },
  {
    id: "t_14_q_9",
    media: "u156uz.webp",
    rasm: "Latin A B C",
    opts: "S | A | V",
    muammo: "Rasm A/B/C, matn S/A/V (C→S, B→V chalkash)",
    severity: "CONFIRMED",
  },
  {
    id: "t_46_q_8",
    media: "u529uz.webp",
    rasm: "Latin A B C",
    opts: "A | V | A va S | S  (ans=V)",
    muammo: "Sun’iy notekislik = B; matnda V. C o‘rniga S",
    severity: "CONFIRMED",
  },
  {
    id: "t_57_q_5",
    media: "u656uz.webp",
    rasm: "Latin A B C",
    opts: "A | S | V  (ans=S)",
    muammo: "Velosiped yo‘lkasi = C; matnda S. B o‘rniga V",
    severity: "CONFIRMED",
  },
  {
    id: "t_54_q_9",
    media: "u623uz.webp",
    rasm: "Latin A B",
    opts: "«B» | «А» | «А» va «B»",
    muammo: "Aralash: Latin B + kirill «А»",
    severity: "CONFIRMED",
  },
  {
    id: "t_27_q_4",
    media: "u296uz.webp",
    rasm: "Kirill А Б В",
    opts: "… Faqat «А» va «B» …",
    muammo: "Rasm kirill, bitta variant Latin «B» (aralash)",
    severity: "CONFIRMED",
  },
  // Phonetic OK (rasm kirill АБВ, matn Latin A/B/V) — NOT listed as CONFIRMED mismatch
];

const by = {};
for (let i = 1; i <= 63; i++) {
  const p = path.join("public/data/variants", `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
    by[q.task_info.global_id] = { ticket: i, order: q.task_info.order, media: q.media_url };
  }
}

const lines = [
  "# Rasm ↔ javob harf ziddiyati (tasdiqlangan)",
  "",
  "JSON manba: `scripts/_letter-mismatch-report.json` (54 ta flag).",
  "Rasmlar: `https://www.avtotestu.uz/images/<media>`",
  "Lokal nusxa (tekshiruv): `scripts/_img-check/`",
  "",
  "## Haqiqiy muammo (rasm yorlig‘i ≠ javob harfi)",
  "",
  "| ID | Variant fayl | media | CDN | Rasm | Matn muammosi |",
  "|----|--------------|-------|-----|------|---------------|",
];

for (const v of VERIFIED) {
  const meta = by[v.id] || {};
  const vfile = meta.ticket ? `public/data/variants/v${meta.ticket}.json` : "?";
  lines.push(
    `| \`${v.id}\` | \`${vfile}\` (order ${meta.order ?? "?"}) | \`${v.media}\` | ${CDN}${v.media} | ${v.rasm} | ${v.muammo} |`
  );
}

lines.push(
  "",
  "## Eslatma — ko‘pchilik CYR_IN_LAT / LAT_V flaglari",
  "",
  "Ba’zi rasmlarda yorliqlar **kirill А Б В Г**. Unda matndagi Latin `A/B/V/G` yoki kirill `«А»/«Б»/«В»` **rasmga mos** (fonetik: В→V, Б→B).",
  "Bularni «rasmda B, javobda V» deb mass-fix qilmang — avval rasmni oching.",
  "",
  "Misollar (rasm kirill, flag noto‘g‘ri ogohlantirgan):",
  "- `t_11_q_16` → u124uz.webp — А Б В",
  "- `t_15_q_16` → u170uz.webp — А Б В (javob V = «В» OK)",
  "- `t_45_q_16` → u525uz.webp — А Б В (javob V = «В» OK)",
  "- `t_48_q_9` → u550uz.webp — А Б В Г",
  "- `t_1_q_12` → u7uz.webp — А Б В (opts kirill — rasmga mos)",
  "",
  "## Eng muhim 7 ta manzil (tuzatish uchun)",
  ""
);

for (const v of VERIFIED) {
  const meta = by[v.id] || {};
  lines.push(`### ${v.id}`);
  lines.push(`- Fayl: \`public/data/variants/v${meta.ticket}.json\``);
  lines.push(`- Rasm: \`${CDN}${v.media}\``);
  lines.push(`- Lokal: \`${LOCAL}${v.media.replace(".webp", ".png")}\``);
  lines.push(`- ${v.muammo}`);
  lines.push("");
}

fs.writeFileSync("scripts/LETTER-MISMATCH-VERIFIED.md", lines.join("\n"), "utf8");
console.log(lines.join("\n"));
