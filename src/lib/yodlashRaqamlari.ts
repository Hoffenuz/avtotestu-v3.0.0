// ============================================================================
// yodlashRaqamlari — imtihonda tez-tez uchraydigan, yodda saqlash qiyin
// raqamli ma'lumotlar (tezlik, masofa, o'lcham va h.k.)
// ----------------------------------------------------------------------------
// MANBA: turli ochiq manbalardagi jadvallar asosida, o'z so'zlarimiz bilan
// qayta yozilgan va qayta tartiblangan (mavzular soddaligi/muhimligi bo'yicha,
// har mavzu ichidagi qatorlar ham shunga ko'ra tartiblangan).
//
// MATN `src/data/seo/yodlash-kerak.json` DA: bot snapshot'lari
// (`scripts/generate-main-pages.cjs`) va til meta jadvali
// (`scripts/generate-seo-meta.cjs`) ham shu fayldan yasaladi. Matn bitta
// joyda — aks holda Google bir narsani, foydalanuvchi boshqasini ko'rardi.
// Bu yerda faqat ko'rinish (ikonka va rang) qo'shiladi.
//
// FORMAT HAQIDA: har bir qator avval NIMA haqida ekanini (`label`), keyin
// qiymatni (`value` + `unit`) ko'rsatadi — faqat bir qiymat oldinga chiqib,
// nimaga tegishli ekani noaniq qolmasligi uchun (masalan "M1 yengil avto —
// 10 gradus", "10 gradus — M1 yengil avto" emas).
//
// DIQQAT: to'xtab turish tormozining ushlab turish ko'rsatkichlari (9-mavzu,
// 2-guruh) foiz sifatida berilgan — manba jadvalda o'lchov birligi aniq
// ko'rinmagan, shuning uchun bu taxminiy. Rasmiy normativ hujjat topilsa,
// tekshirib almashtirilsin.
// ============================================================================

import type { LucideIcon } from "lucide-react";
import { Gauge, Timer, Ban, AlertTriangle, Ruler, Box, Link2, CircleDot, Wrench, ListChecks } from "lucide-react";
import type { Localized } from "./avtodromPenalties";
import type { SectionAccent } from "./siteSections";
// Nisbiy yo'l ATAYLAB ("@/" emas): mobil ilova generatori
// (avtotest_app/tools/gen_sections.mjs) bu faylni esbuild bilan o'qiydi,
// esbuild esa Vite'ning "@/" taxallusini bilmaydi.
import topicsContent from "../data/seo/yodlash-kerak.json";

export interface FactRow {
  label: Localized;
  value: string;
  unit: Localized;
}

export interface FactGroup {
  heading: Localized;
  rows: readonly FactRow[];
}

interface FactTopicContent {
  id: string;
  title: Localized;
  subtitle: Localized;
  groups: readonly FactGroup[];
}

export interface FactTopic extends FactTopicContent {
  icon: LucideIcon;
  accent: SectionAccent;
}

/** Mavzu ko'rinishi. JSON ga yangi mavzu qo'shilsa, shu yerga ham qo'shilsin. */
const TOPIC_LOOK: Record<string, { icon: LucideIcon; accent: SectionAccent }> = {
  tezlik: { icon: Gauge, accent: "rose" },
  reaktsiya: { icon: Timer, accent: "sky" },
  toxtash: { icon: Ban, accent: "violet" },
  "avariya-belgisi": { icon: AlertTriangle, accent: "orange" },
  gabarit: { icon: Ruler, accent: "cyan" },
  yuk: { icon: Box, accent: "amber" },
  shatak: { icon: Link2, accent: "emerald" },
  shina: { icon: CircleDot, accent: "indigo" },
  "rul-tormoz": { icon: Wrench, accent: "teal" },
};

/** Ko'rinishi belgilanmagan yangi mavzu ham sahifada chiqaveradi. */
const DEFAULT_LOOK = { icon: ListChecks, accent: "sky" } as const satisfies {
  icon: LucideIcon;
  accent: SectionAccent;
};

export const FACT_TOPICS: readonly FactTopic[] = (topicsContent as FactTopicContent[]).map(
  (topic) => ({ ...topic, ...(TOPIC_LOOK[topic.id] ?? DEFAULT_LOOK) }),
);
