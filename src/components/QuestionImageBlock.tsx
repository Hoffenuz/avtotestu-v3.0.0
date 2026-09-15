import { useEffect, useRef, useState } from "react";
import imageSizes from "@/data/question-image-sizes.json";
import { cn } from "@/lib/utils";

interface QuestionImageBlockProps {
  src: string;
  alt?: string;
  onZoom: () => void;
  /** Mobile: stacked above answers. Desktop: side column. */
  layout: "mobile" | "desktop";
}

/**
 * Question illustration with size limits so square / tall images fit on screen.
 * Full size available via lightbox on click.
 *
 * MUHIM — `width`/`height` ATRIBUTLARI NEGA BOR:
 * Ular bo'lmasa brauzer rasm yuklanmaguncha uning balandligini bilmaydi va joy
 * zahiralamaydi. Rasm kelganda pastdagi javob tugmalari pastga surilardi —
 * Cloudflare RUM da bu CLS 0.145-0.207 (289 hodisa) bo'lib ko'rinardi va eng
 * yomoni: foydalanuvchi javobni bosmoqchi bo'lganda tugmalar surilib,
 * BOSHQA javobga bosib yuborishi mumkin edi.
 *
 * O'lchamlar `scripts/generate-image-sizes.cjs` tomonidan `prebuild` da
 * avtomatik yig'iladi, ya'ni yangi rasm qo'shilsa manifest o'zi yangilanadi.
 */
const HAS_IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

/** `u123uz.webp` — savol rasmlarining 97% i shu shaklda (manifestda raqam kaliti bilan). */
const NUMBERED_NAME = /^u(\d+)uz\.webp$/;

/**
 * Manifestda topilmagan rasm uchun zaxira nisbat.
 *
 * 732 ta mavjud rasmning MEDIAN nisbati 1.61 (p25=1.50, p75=1.77) — ya'ni
 * juda zich guruhlangan. Noma'lum rasm uchun ham shu nisbatdan foydalanamiz:
 * bu "hech qanday o'lcham yo'q" holatidan ancha yaxshi, chunki quti baribir
 * oldindan zahiralanadi va siljish bo'lmaydi (`object-contain` rasm
 * cho'zilishining oldini oladi, kerak bo'lsa atrofida bo'sh joy qoladi).
 */
const FALLBACK_SIZE: readonly [number, number] = [1280, 794];

/**
 * JSON dan kelgan tur `number[]` (TypeScript uni kortej deb bilmaydi), shuning
 * uchun ataylab bo'sh-qo'l tur ishlatamiz va `pair()` da uzunlikni tekshiramiz.
 * Bu 732 ta kalit uchun ulkan literal tur hosil bo'lishining ham oldini oladi.
 */
type SizeTable = {
  numbered: Record<string, number[] | undefined>;
  other: Record<string, number[] | undefined>;
};
const sizes = imageSizes as unknown as SizeTable;

/** Manifestdagi yozuv haqiqiy [en, bo'y] juftligi bo'lsa qaytaradi. */
function pair(value: number[] | undefined): readonly [number, number] | null {
  if (!value || value.length !== 2) return null;
  const [w, h] = value;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return [w, h];
}

/**
 * `/images/u12uz.webp?v=abc` -> `u12uz.webp`
 *
 * So'rov (`?`) va hash (`#`) qismlari OLIB TASHLANADI. Bu muhim: aks holda
 * kengaytma tekshiruvi (`HAS_IMAGE_EXT`) `$` langari tufayli ishlamay, rasm
 * eski `<picture>` tarmog'iga tushib qolardi va `.png` deb qidirilardi —
 * ya'ni butunlay buzilgan rasm.
 */
export function fileNameOf(src: string): string {
  return src.split("/").pop()?.split(/[?#]/)[0] ?? "";
}

/**
 * Fayl nomidan `[w, h]`. Topilmasa zaxira nisbat qaytadi.
 *
 * Eksport qilingan — `Savol.tsx` kabi savol rasmini boshqa maketda
 * ko'rsatadigan joylar ham xuddi shu CLS-xavfsiz o'lchamdan foydalansin,
 * mantiq ikki joyda alohida-alohida yozilib, ulardan biri unutilib
 * qolmasin.
 */
export function lookupSize(file: string): readonly [number, number] {
  const numbered = NUMBERED_NAME.exec(file);
  if (numbered) {
    const hit = pair(sizes.numbered[numbered[1]]);
    if (hit) return hit;
  }

  return pair(sizes.other[file]) ?? FALLBACK_SIZE;
}

/**
 * Rasm yuklanmaguncha "skeleton" (yaltirab turuvchi kulrang quti).
 *
 * Joy allaqachon `width`/`height` bilan zahiralangan — ya'ni siljish yo'q edi,
 * lekin sekin internetda o'sha joy BO'SH oq quti bo'lib turardi va foydalanuvchi
 * rasm bormi yoki buzuqmi bilmasdi. Kulrang jonli fon "kelyapti" degani.
 *
 * `complete` tekshiruvi kerak: keshdagi rasmda brauzer `onLoad` ni React
 * hodisani ulashidan OLDIN chaqiradi va skeleton abadiy qotib qolardi.
 */
function useImageLoaded() {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);

  // Xato bo'lsa ham skeletonni o'chiramiz — aks holda u cheksiz yaltirab turadi.
  return { ref, loaded, onLoad: () => setLoaded(true), onError: () => setLoaded(true) };
}

export function QuestionImageBlock({
  src,
  alt = "Question illustration",
  onZoom,
  layout,
}: QuestionImageBlockProps) {
  const { ref, loaded, onLoad, onError } = useImageLoaded();
  const skeletonClass = loaded ? "" : "animate-pulse bg-muted";
  /**
   * Mobil o'lcham ATAYLAB o'zgartirilmadi: telefonda rasm javob tugmalarining
   * USTIDA turadi, kattalashtirilsa javoblar ekrandan pastga tushib ketardi.
   * Bundan tashqari mobilda rasm allaqachon ustun eniga tiralgan (~334px), ya'ni
   * `max-h` ni oshirish tipik 1.6 nisbatli rasmga ta'sir ham qilmasdi.
   *
   * Desktopda esa rasm alohida 45% li ustunda, javoblarga xalaqit bermaydi —
   * shuning uchun u yerda kattalashtirildi: max-h-64/72 -> max-h-80/26rem.
   * `min(...,50vh)` past bo'yli noutbuklarda rasm ekranni egallab ketmasligi
   * uchun xavfsizlik cheklovi.
   */
  /*
    `w-full` (ilgari `w-auto` edi) — bu CLS uchun HAL QILUVCHI.

    `width`/`height` atributlari to'g'ri berilgan bo'lsa ham, `w-auto h-auto`
    da brauzer rasm KELMAGUNCHA qutini 0x0 deb hisoblaydi: aniq en bo'lmasa
    nisbatdan balandlikni chiqarib bo'lmaydi. Natijada rasm kelganda karta
    birdan ~208px ga cho'zilib, ostidagi hamma narsa siljirdi.

    `w-full` bilan en ustun eniga teng bo'ladi, balandlik esa nisbatdan
    darhol hisoblanadi — joy oldindan band qilinadi.

    `maxWidth` (inline, haqiqiy piksel) rasm o'z o'lchamidan KATTA qilib
    cho'zilishining oldini oladi. 738 ta rasmdan bittasi ustun enidan tor.
  */
  const imgClass =
    layout === "mobile"
      ? "mx-auto block w-full h-auto max-h-52 sm:max-h-56 object-contain rounded"
      : "mx-auto block w-full h-auto max-h-80 lg:max-h-[min(26rem,50vh)] object-contain rounded";

  const buttonClass =
    "flex w-full justify-center cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded";

  const fileName = fileNameOf(src);
  const [width, height] = lookupSize(fileName);

  // DIQQAT: xom `src` emas, tozalangan fayl nomi tekshiriladi — yuqoridagi
  // `fileNameOf` izohiga qarang.
  if (HAS_IMAGE_EXT.test(fileName)) {
    return (
      <button type="button" className={buttonClass} onClick={onZoom}>
        <img
          ref={ref}
          src={src}
          alt={alt}
          className={cn(imgClass, skeletonClass)}
          style={{ maxWidth: width }}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onLoad={onLoad}
          onError={onError}
        />
      </button>
    );
  }

  // Kengaytmasiz eski yo'llar uchun zaxira. Bu yerda aniq fayl nomi noma'lum,
  // shuning uchun median nisbat ishlatiladi — joy baribir zahiralanadi.
  return (
    <button type="button" className={buttonClass} onClick={onZoom}>
      <picture>
        <source srcSet={`${src}.png`} type="image/png" />
        <source srcSet={`${src}.jpg`} type="image/jpeg" />
        <source srcSet={`${src}.jpeg`} type="image/jpeg" />
        <img
          ref={ref}
          src={`${src}.png`}
          alt={alt}
          className={cn(imgClass, skeletonClass)}
          style={{ maxWidth: FALLBACK_SIZE[0] }}
          width={FALLBACK_SIZE[0]}
          height={FALLBACK_SIZE[1]}
          loading="lazy"
          decoding="async"
          onLoad={onLoad}
          onError={onError}
        />
      </picture>
    </button>
  );
}
