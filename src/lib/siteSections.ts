// ============================================================================
// siteSections — /bolimlar sahifasidagi bo'limlar ro'yxati
// ----------------------------------------------------------------------------
// NIMA UCHUN GURUHLANGAN:
//   Guruh sarlavhalari ro'yxatni ikkita MAQSADGA bo'ladi: mashq qilaman /
//   o'rganaman. Ko'z avval maqsadni tanlaydi, keyin ichidan 4-5 tasini
//   ko'radi — bu to'qqizta bir xil plitkadan tanlashdan yengilroq.
//
// NIMA KIRADI VA NIMA KIRMAYDI:
//   Kiradi — foydalanuvchi BAJARADIGAN amallar.
//   Kirmaydi — Darslik va Yangiliklar: ular header'da o'z bandiga ega,
//   takrorlash katalogni suyultirardi. Kompyuter ilova ham kirmaydi: u
//   bo'lim emas, YUKLAB OLINADIGAN mahsulot — `/bolimlar` pastida alohida,
//   kengroq kartochkada turadi (aks holda 13 ta bir xil plitka orasida
//   ko'zdan yo'qolardi).
//
// DIQQAT: faqat MAVJUD marshrutlar. Ishlamaydigan havola — yomon tajriba.
// ============================================================================

import {
  AlertTriangle,
  Bookmark,
  Brain,
  ClipboardCheck,
  GraduationCap,
  Hash,
  Search,
  Signpost,
  Timer,
  TrafficCone,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Ikonka foni uchun rang — "Yodlash kerak" mavzulari uchun (har mavzu o'z
 * rangida). Bo'lim plitkalari (`SectionGrid`) endi rangsiz, siyoh ikonkada.
 *
 * Faqat STATIK Tailwind sinflari. Dinamik yasalgan sinf nomini
 * (`bg-${color}-500/10` kabi) Tailwind build paytida topa olmaydi.
 */
export type SectionAccent = "rose" | "amber" | "sky" | "violet" | "emerald" | "cyan" | "orange" | "indigo" | "teal";

export const ACCENT_CLASS: Record<SectionAccent, string> = {
  rose: "bg-rose-500/10 text-rose-500",
  amber: "bg-amber-500/10 text-amber-500",
  sky: "bg-sky-500/10 text-sky-500",
  violet: "bg-violet-500/10 text-violet-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  cyan: "bg-cyan-500/10 text-cyan-500",
  orange: "bg-orange-500/10 text-orange-500",
  indigo: "bg-indigo-500/10 text-indigo-500",
  teal: "bg-teal-500/10 text-teal-500",
};

export interface SectionItem {
  to: string;
  /**
   * Tarjima kaliti (`sections.*`), tayyor matn EMAS.
   * Sayt uch tilda ishlaydi — bo'lim nomlari ham tarjima qilinishi shart.
   */
  titleKey: string;
  /**
   * Qisqa tavsif kaliti. Faqat `/bolimlar` da ko'rsatiladi
   * (`SectionGrid` ning `showDescription` xossasi) — bosh sahifadagi
   * tezkor plitkalar ixcham qolishi kerak.
   */
  descKey: string;
  icon: LucideIcon;
  /**
   * Hisobga kirish talab qilinadi.
   *
   * Bunday bo'limlar kirmagan foydalanuvchiga ham KO'RSATILADI (qulf belgisi
   * bilan) — yashirish "sayt kambag'al" degan taassurot qoldirardi. Bosilsa
   * sahifaning o'zi kirishni taklif qiladi.
   */
  requiresAuth?: boolean;
  /**
   * PRO obuna talab qilinadi.
   *
   * Plitkada toj belgisi ko'rsatiladi — foydalanuvchi bosib, gate ekraniga
   * urilib qaytishdan ko'ra, oldindan bilgani yaxshiroq.
   */
  requiresPro?: boolean;
}

export interface SectionGroup {
  /** Tarjima kaliti (`sections.group*`). */
  titleKey: string;
  /** Guruh sarlavhasi yonidagi ikonka. */
  icon: LucideIcon;
  items: readonly SectionItem[];
}

/**
 * Katalog — ikkita maqsad bo'yicha guruhlangan.
 *
 * TEST REJIMLARI (Test ishlash, Variantlar, Mavzuli testlar) BU YERDA YO'Q:
 * ular bosh sahifadagi asosiy tugmalarda turadi va u yerdan boshlanadi.
 * Katalogda takrorlanishi ro'yxatni uzaytirib, aynan shu sahifaga xos
 * amallarni ko'zdan yashirardi.
 *
 * "Real imtihon" esa ATAYLAB QOLDIRILGAN: u oddiy test emas, alohida
 * shartlardagi imtihon rejimi va bosh sahifada har doim ham ko'rinmaydi —
 * katalogdan tushib qolsa, unga doimiy yo'l qolmasdi.
 */
export const SECTION_GROUPS: readonly SectionGroup[] = [
  {
    titleKey: "sections.groupPractice",
    icon: ClipboardCheck,
    items: [
      { to: "/real-imtihon", titleKey: "sections.realImtihon", descKey: "sections.realImtihonDesc", icon: Timer, requiresPro: true },
      { to: "/xatolar-testi", titleKey: "sections.xatolarTesti", descKey: "sections.xatolarTestiDesc", icon: Brain, requiresPro: true },
      // Xatolarni KO'RISH bepul (faqat kirish kerak) — xatolar Telegram
      // bot bilan ham bog'langan, o'z xatosini ko'ra olmaslik foydalanuvchini
      // saytdan uzoqlashtiradi. Ular USTIDA ISHLASH (/xatolar-testi) — PRO.
      // Real imtihon — PRO (2026-09-26, egasining qarori).
      { to: "/xatolarim", titleKey: "sections.xatolarim", descKey: "sections.xatolarimDesc", icon: XCircle, requiresAuth: true },
      { to: "/saqlangan", titleKey: "sections.saqlangan", descKey: "sections.saqlanganDesc", icon: Bookmark, requiresAuth: true },
      { to: "/qiyin-savollar", titleKey: "sections.qiyinSavollar", descKey: "sections.qiyinSavollarDesc", icon: AlertTriangle, requiresPro: true },
    ],
  },
  {
    titleKey: "sections.groupLearn",
    icon: GraduationCap,
    items: [
      { to: "/belgilar", titleKey: "sections.belgilar", descKey: "sections.belgilarDesc", icon: Signpost },
      { to: "/avtodrom", titleKey: "sections.avtodrom", descKey: "sections.avtodromDesc", icon: TrafficCone },
      { to: "/yodlash-kerak", titleKey: "sections.yodlashKerak", descKey: "sections.yodlashKerakDesc", icon: Hash },
      { to: "/qidirish", titleKey: "sections.qidirish", descKey: "sections.qidirishDesc", icon: Search, requiresPro: true },
    ],
  },
];

/** Guruhlardan qat'i nazar kerak bo'ladigan yassi ro'yxat. */
export const SECTION_ITEMS: readonly SectionItem[] = SECTION_GROUPS.flatMap((g) => g.items);

/**
 * Bosh sahifada ko'rsatiladigan TEZKOR amallar.
 *
 * Faqat uchtasi va tartib MUHIMLIK bo'yicha: avval imtihon (saytga kelishning
 * asosiy sababi), keyin xatolar ustida ishlash, oxirida qiyin savollar.
 *
 * "Savol qidirish" o'rniga "Qiyin savollar" turadi: qidiruv KERAKLI savolni
 * topish uchun, ya'ni odam nima izlayotganini oldindan bilishi kerak. Qiyin
 * savollar esa nimani mashq qilish kerakligini O'ZI aytadi — haqiqiy
 * foydalanuvchi xatolaridan hisoblangan. Qidiruv /bolimlar da qoladi.
 *
 * "Xato savollarim" ATAYLAB yo'q: u faqat KO'RSATADI, "Xatolar ustida ishlash"
 * esa o'sha savollarni qayta YECHTIRADI — ikkinchisi foydaliroq va ikkalasi
 * yonma-yon turganda foydalanuvchi qaysi birini bosishni bilmay qolardi.
 * Ro'yxat ko'rinishi `/bolimlar` da saqlanib qolgan.
 *
 */
const QUICK_PATHS = ["/real-imtihon", "/xatolar-testi", "/qiyin-savollar"] as const;

/**
 * Katalogdan OLINADI, qayta yozilmaydi.
 *
 * Ilgari "Real imtihon" bu yerda alohida, qo'lda yozilgan edi va uning
 * rangi katalogdagisidan farq qilardi — bir xil bo'lim ikki sahifada ikki
 * xil ko'rinardi. Endi manba bitta.
 */
export const QUICK_ITEMS: readonly SectionItem[] = QUICK_PATHS.map((to) => {
  const item = SECTION_ITEMS.find((candidate) => candidate.to === to);
  if (!item) throw new Error(`QUICK_ITEMS: "${to}" katalogda topilmadi`);
  return item;
});
