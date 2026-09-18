/**
 * Qo'llanma sahifasidagi qadamlar va bepul/PRO taqqoslash jadvali.
 *
 * MATN BU YERDA EMAS — tarjima kalitlari (`qollanma.*`) ishlatiladi, ya'ni
 * sahifa uchala tilda ham ishlaydi. Bu yerda faqat TUZILMA: qaysi qadam
 * qayerga havola qiladi va unga qaysi rasm/video biriktirilgan.
 *
 * EKRAN SURATI QO'SHISH:
 *   1. Faylni `public/qollanma/` ga qo'ying.
 *   2. Shu yerda `media` ni to'ldiring.
 *   Fayl hali yo'q bo'lsa `media` ni tegmay qoldiring — qadam matni bilan
 *   ishlayveradi, singan rasm belgisi chiqmaydi (GuideMedia.tsx ga qarang).
 */
import { BookOpen, FileStack, Play, Timer, XCircle, type LucideIcon } from "lucide-react";
import type { GuideMediaSource } from "@/components/GuideMedia";

export interface QollanmaStep {
  titleKey: string;
  textKey: string;
  icon: LucideIcon;
  /** Qadamda aytilgan bo'limga havola. */
  to: string;
  media?: GuideMediaSource;
}

export const QOLLANMA_STEPS: readonly QollanmaStep[] = [
  {
    titleKey: "qollanma.step1Title",
    textKey: "qollanma.step1Text",
    icon: Play,
    to: "/test-ishlash",
    // media: { type: "image", src: "/qollanma/1-test-ishlash.webp" },
  },
  {
    titleKey: "qollanma.step2Title",
    textKey: "qollanma.step2Text",
    icon: FileStack,
    to: "/variant",
    // media: { type: "image", src: "/qollanma/2-variantlar.webp" },
  },
  {
    titleKey: "qollanma.step3Title",
    textKey: "qollanma.step3Text",
    icon: XCircle,
    to: "/xatolarim",
    // media: { type: "image", src: "/qollanma/3-xatolar.webp" },
  },
  {
    titleKey: "qollanma.step4Title",
    textKey: "qollanma.step4Text",
    icon: Timer,
    to: "/real-imtihon",
    // media: { type: "video", src: "/qollanma/4-real-imtihon.mp4" },
  },
];

/**
 * Bepul va PRO taqqoslash qatorlari.
 *
 * `free` / `pro`: `true` — bor, `false` — yo'q, matn kaliti — aniq qiymat
 * (masalan "1009 ta"). Raqamlar HAQIQIY bazadan olingan:
 *   bepul  free-*.json  = 1009 savol
 *   PRO    barcha-*.json = 1260 savol
 * Ularni o'zgartirishdan oldin fayllarni sanab ko'ring — noto'g'ri raqam
 * reklama sifatida jiddiy da'vo bo'ladi.
 */
export interface CompareRow {
  labelKey: string;
  free: boolean | string;
  pro: boolean | string;
}

export const QOLLANMA_COMPARE: readonly CompareRow[] = [
  { labelKey: "qollanma.cmp1", free: "qollanma.cmp1Free", pro: "qollanma.cmp1Pro" },
  { labelKey: "qollanma.cmp2", free: "qollanma.cmp2Free", pro: "qollanma.cmp2Pro" },
  { labelKey: "qollanma.cmp9", free: true, pro: true },
  { labelKey: "qollanma.cmp10", free: "qollanma.cmp10Free", pro: "qollanma.cmp10Pro" },
  { labelKey: "qollanma.cmp3", free: false, pro: true },
  { labelKey: "qollanma.cmp4", free: false, pro: true },
  { labelKey: "qollanma.cmp5", free: false, pro: true },
  { labelKey: "qollanma.cmp6", free: false, pro: true },
  { labelKey: "qollanma.cmp7", free: false, pro: true },
  { labelKey: "qollanma.cmp8", free: false, pro: true },
];

export const QOLLANMA_GUIDE_ICON = BookOpen;
