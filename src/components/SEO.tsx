import { Helmet } from "react-helmet-async";
import { detectLangFromWindow, buildLangPath, langAlternates } from "@/lib/langUrl";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const BASE_URL = "https://www.avtotestu.uz";
/*
  Ijtimoiy tarmoqda ulashilganda ko'rinadigan rasm — 1200x630 (Facebook,
  Telegram, Twitter uchun standart nisbat). JPEG ataylab: WebP ni ba'zi
  skreyperlar (masalan LinkedIn) hamon to'liq qo'llab-quvvatlamaydi,
  JPEG esa hamma joyda ishlaydi.
*/
const DEFAULT_OG_IMAGE = `${BASE_URL}/avtosmart-og.jpg`;

export function SEO({
  title,
  description,
  path,
  keywords,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
}: SEOProps) {
  /*
    `path` — TIL PREFIKSISIZ yo'l (masalan `/belgilar`), chunki sahifalar
    uni shunday uzatadi. Canonical esa joriy tilning manzili bo'lishi
    kerak: `/ru/belgilar` sahifasi o'zini o'zi canonical qilsin, aks
    holda uchala til bitta manzilga ishora qilib, ruscha va kirillcha
    versiyalar indeksdan tushib qolardi.
  */
  const { lang } = detectLangFromWindow();
  const fullUrl = `${BASE_URL}${buildLangPath(lang, path)}`;

  /*
    BREND QO'SHIMCHASI OXIRIDA, BOSHIDA EMAS.

    Google sarlavhaning BOSHINI eng og'ir baholaydi. Search Console
    ma'lumoti (28 kun): "avto test" — 10 915 klik, 1.15-pozitsiya;
    "prava test" — 4 888 klik. "avtosmart" bo'yicha esa 0 klik, brend
    hali qidiruvda mavjud emas. Shuning uchun kalit so'zlar oldinda
    qoladi, brend esa oxirida — u yerda tanilishga xizmat qiladi,
    lekin reytingga tegmaydi.

    Bosh sahifa ham qo'shimchani OLADI: ilgari u brendsiz edi, ya'ni
    saytning eng ko'p ko'riladigan natijasida nom umuman ko'rinmasdi.
    Uzunlik 54 belgi — Google ~60 belgigacha ko'rsatadi, kesilmaydi.
  */
  const fullTitle = `${title} | AvtoSmart`;

  /*
    hreflang — uchala versiyani bir-biriga bog'laydi.

    Bu Google ga "bu bir sahifaning uch tildagi varianti" deb aytadi va
    ikki muammoni hal qiladi: versiyalar bir-birining nusxasi deb
    hisoblanmaydi, va foydalanuvchiga o'z tilidagisi ko'rsatiladi.

    `x-default` — tili mos kelmagan foydalanuvchiga qaysi versiya
    ko'rsatilishi. Bu yerda asosiy til.
  */
  const alternates = langAlternates(path, BASE_URL);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="AvtoSmart" />

      {/* Robots */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* hreflang — uchala til versiyasi bir-biriga bog'lanadi */}
      {alternates.map((a) => (
        <link key={a.hreflang} rel="alternate" hrefLang={a.hreflang} href={a.href} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${path}`} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={lang === "ru" ? "ru_RU" : "uz_UZ"} />
      <meta property="og:site_name" content="AvtoSmart" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/*
        `<html lang>` ATAYLAB bu yerda EMAS.

        Ilgari bu yerda `<html lang="uz" />` turardi va ikki muammo tug'dirardi:
        1. Helmet uni har render'da "uz" ga qaytarib, `LanguageContext` ning
           tilga mos qiymatini (uz / uz-Cyrl / ru) bosib ketardi;
        2. SEO komponenti unmount bo'lganda (masalan real imtihon boshlanib
           sahifa almashganda) Helmet atributni butunlay OLIB TASHLAB,
           `lang=""` qoldirardi.

        Til endi faqat `LanguageContext` da o'rnatiladi — yagona manba.
      */}
    </Helmet>
  );
}
