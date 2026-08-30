// ============================================================================
// siteSections — /bolimlar sahifasidagi bo'limlar ro'yxati
// ----------------------------------------------------------------------------
// NIMA KIRADI VA NIMA KIRMAYDI:
//   Bu yerda faqat SAVOL BILAN ISHLASH bo'limlari turadi — foydalanuvchi
//   test yechish, xatolarini takrorlash yoki savol izlash uchun keladi.
//
//   Darslik, Qo'shimcha va Yangiliklar ATAYLAB kiritilmagan: ular o'quv/
//   axborot materiallari va header menyusida allaqachon bor. Ularni bu yerga
//   qo'shish ro'yxatni suyultirib, asosiy bo'limlarni ko'zdan yashiradi.
//
// DIQQAT: faqat MAVJUD marshrutlar. Ishlamaydigan havola — yomon tajriba.
// ============================================================================

import {
  Bookmark,
  Brain,
  Hash,
  Search,
  Signpost,
  Timer,
  TrafficCone,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Ikonka foni uchun rang. Har bir bo'lim o'z rangiga ega bo'lsa, ko'z
 * plitkalarni tezroq ajratadi — bir xil rangli to'r o'qilmaydi.
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
  accent: SectionAccent;
  /**
   * Hisobga kirish talab qilinadi.
   *
   * Bunday bo'limlar kirmagan foydalanuvchiga ham KO'RSATILADI (qulf belgisi
   * bilan) — yashirish "sayt kambag'al" degan taassurot qoldirardi. Bosilsa
   * sahifaning o'zi kirishni taklif qiladi.
   */
  requiresAuth?: boolean;
  /**
   * Bo'lim to'liq ekranda ishlaydi — plitka bosilganda to'liq ekran
   * so'raladi.
   *
   * NEGA AYNAN SHU YERDA: brauzer `requestFullscreen()` ni FAQAT
   * foydalanuvchi harakati doirasida qabul qiladi. Maqsad sahifasi
   * navigatsiyadan keyin ochiladi va o'sha doira tugagan bo'ladi — u yerdan
   * so'ralsa rad etiladi. SPA navigatsiyasi sahifani qayta yuklamagani
   * uchun bu yerda olingan to'liq ekran keyingi sahifada ham saqlanadi.
   */
  fullscreenOnOpen?: boolean;
}

/**
 * "Mavzuli testlar" va "Variantlar" bu yerda ATAYLAB YO'Q: ikkalasi ham bosh
 * sahifadagi asosiy tugmalarda turadi. Bir xil havolani ikki joyda takrorlash
 * ro'yxatni uzaytirib, aynan shu bo'limga xos amallarni ko'zdan yashirardi.
 */
export const SECTION_ITEMS: readonly SectionItem[] = [
  { to: "/xatolar-testi", titleKey: "sections.xatolarTesti", descKey: "sections.xatolarTestiDesc", icon: Brain, accent: "rose", requiresAuth: true },
  { to: "/xatolarim", titleKey: "sections.xatolarim", descKey: "sections.xatolarimDesc", icon: XCircle, accent: "amber", requiresAuth: true },
  { to: "/saqlangan", titleKey: "sections.saqlangan", descKey: "sections.saqlanganDesc", icon: Bookmark, accent: "violet", requiresAuth: true },
  { to: "/qidirish", titleKey: "sections.qidirish", descKey: "sections.qidirishDesc", icon: Search, accent: "cyan" },
  { to: "/belgilar", titleKey: "sections.belgilar", descKey: "sections.belgilarDesc", icon: Signpost, accent: "emerald" },
  { to: "/avtodrom", titleKey: "sections.avtodrom", descKey: "sections.avtodromDesc", icon: TrafficCone, accent: "amber" },
  { to: "/yodlash-kerak", titleKey: "sections.yodlashKerak", descKey: "sections.yodlashKerakDesc", icon: Hash, accent: "indigo" },
];

/**
 * Bosh sahifada ko'rsatiladigan TEZKOR amallar.
 *
 * Faqat uchtasi va tartib MUHIMLIK bo'yicha: avval imtihon (saytga kelishning
 * asosiy sababi), keyin xatolar ustida ishlash, oxirida qidiruv.
 *
 * "Xato savollarim" ATAYLAB yo'q: u faqat KO'RSATADI, "Xatolar ustida ishlash"
 * esa o'sha savollarni qayta YECHTIRADI — ikkinchisi foydaliroq va ikkalasi
 * yonma-yon turganda foydalanuvchi qaysi birini bosishni bilmay qolardi.
 * Ro'yxat ko'rinishi `/bolimlar` da saqlanib qolgan.
 *
 */
export const QUICK_ITEMS: readonly SectionItem[] = [
  {
    to: "/real-imtihon",
    titleKey: "sections.realImtihon",
    descKey: "sections.realImtihonDesc",
    icon: Timer,
    accent: "emerald",
    fullscreenOnOpen: true,
  },
  ...SECTION_ITEMS.filter((item) => ["/xatolar-testi", "/qidirish"].includes(item.to)),
];
