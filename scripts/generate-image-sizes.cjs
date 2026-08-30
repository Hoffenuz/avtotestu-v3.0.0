#!/usr/bin/env node
/**
 * public/images/*.webp o'lchamlarini o'qib, `src/data/question-image-sizes.json`
 * manifestini yaratadi.
 *
 * NEGA KERAK:
 * Savol rasmi `<img>` da `width`/`height` bo'lmasa, brauzer rasm yuklanmaguncha
 * uning balandligini BILMAYDI va joy zahiralamaydi. Rasm kelganda pastdagi
 * javob tugmalari pastga surilib ketadi — bu Cloudflare RUM da CLS 0.145-0.207
 * (289 hodisa) bo'lib ko'rinardi.
 *
 * Bu shunchaki metrika muammosi emas: foydalanuvchi javobni bosmoqchi bo'lganda
 * tugmalar suriladi va U BOSHQA JAVOBGA bosib yuborishi mumkin.
 *
 * Manifest bilan `<img>` ga aniq `width`/`height` beriladi — brauzer rasm
 * yuklanishidan OLDIN aniq joy zahiralaydi, hech qanday siljish bo'lmaydi.
 *
 * Bu skript `prebuild` da ishlaydi, ya'ni yangi rasm qo'shilsa manifest
 * avtomatik yangilanadi — xuddi QUESTION_DATA_CACHE_BUST kabi, qo'lda
 * yangilashni unutish mumkin emas.
 *
 * Tashqi kutubxona ISHLATILMAYDI: WebP sarlavhasi to'g'ridan-to'g'ri o'qiladi.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'question-image-sizes.json');

/**
 * WebP sarlavhasidan o'lchamni o'qiydi.
 *
 * Uch xil konteyner bor va uchalasi ham uchraydi:
 *   VP8   — yo'qotishli (lossy), eng keng tarqalgan
 *   VP8L  — yo'qotishsiz (lossless)
 *   VP8X  — kengaytirilgan (alpha/animatsiya bo'lganda)
 *
 * @returns {{w:number,h:number}|null}
 */
function readWebpSize(buf) {
  // Eng qisqa haqiqiy sarlavha ham 30 baytdan katta
  if (buf.length < 30) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buf.toString('ascii', 8, 12) !== 'WEBP') return null;

  const fourcc = buf.toString('ascii', 12, 16);

  if (fourcc === 'VP8 ') {
    // VP8 kadr sarlavhasidagi sinxronlash kodi — bo'lmasa fayl buzilgan
    if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return null;
    // 14 bit en, 14 bit bo'y (yuqori 2 bit — masshtab, bizga kerak emas)
    return {
      w: buf.readUInt16LE(26) & 0x3fff,
      h: buf.readUInt16LE(28) & 0x3fff,
    };
  }

  if (fourcc === 'VP8L') {
    if (buf[20] !== 0x2f) return null;
    const b0 = buf[21];
    const b1 = buf[22];
    const b2 = buf[23];
    const b3 = buf[24];
    return {
      w: 1 + (((b1 & 0x3f) << 8) | b0),
      h: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }

  if (fourcc === 'VP8X') {
    // 24 bitli little-endian canvas o'lchami (qiymat 1 dan boshlanadi)
    return {
      w: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
      h: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
    };
  }

  return null;
}

/**
 * Savol rasmlarining 97% i `u<raqam>uz.webp` shaklida. Manifest hajmini
 * kichraytirish uchun ular faqat raqam kaliti bilan saqlanadi, qolganlari
 * to'liq nom bilan.
 */
const NUMBERED = /^u(\d+)uz\.webp$/;

function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`[image-sizes] Papka topilmadi: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => f.toLowerCase().endsWith('.webp'))
    .sort();

  /** @type {Record<string, [number, number]>} */
  const numbered = {};
  /** @type {Record<string, [number, number]>} */
  const other = {};
  const broken = [];

  for (const file of files) {
    let size = null;
    try {
      // Sarlavha uchun butun faylni o'qish shart emas, lekin fayllar kichik
      // (o'rtacha ~15 KB) va bu skript build da bir marta ishlaydi.
      size = readWebpSize(fs.readFileSync(path.join(IMAGES_DIR, file)));
    } catch (err) {
      broken.push(`${file} (o'qib bo'lmadi: ${err.message})`);
      continue;
    }

    if (!size || !size.w || !size.h) {
      broken.push(`${file} (sarlavha tanilmadi)`);
      continue;
    }

    const m = NUMBERED.exec(file);
    if (m) numbered[m[1]] = [size.w, size.h];
    else other[file] = [size.w, size.h];
  }

  const manifest = { numbered, other };

  // Kalitlar tartibi barqaror bo'lishi uchun qayta qurmaymiz — readdir
  // allaqachon saralangan, JSON.stringify shu tartibni saqlaydi. Bu muhim:
  // aks holda har build da fayl o'zgarib, keraksiz git diff hosil bo'lardi.
  const json = JSON.stringify(manifest);

  const prev = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : null;
  if (prev === json) {
    console.log(
      `[image-sizes] O'zgarish yo'q — ${files.length} ta rasm, ${(json.length / 1024).toFixed(1)} KB`,
    );
  } else {
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, json);
    console.log(
      `[image-sizes] Yozildi: ${Object.keys(numbered).length + Object.keys(other).length} ta rasm, ` +
        `${(json.length / 1024).toFixed(1)} KB -> src/data/question-image-sizes.json`,
    );
  }

  if (broken.length) {
    // XATO EMAS: bitta rasm o'qilmasa ham sayt ishlaydi (fallback nisbat bor).
    // Lekin jimgina o'tkazib yubormaymiz — build logida ko'rinsin.
    console.warn(`[image-sizes] OGOHLANTIRISH — ${broken.length} ta rasm o'qilmadi:`);
    for (const b of broken.slice(0, 10)) console.warn(`  - ${b}`);
    if (broken.length > 10) console.warn(`  ... yana ${broken.length - 10} ta`);
  }
}

main();
