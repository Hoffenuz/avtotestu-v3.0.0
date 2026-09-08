// ============================================================================
// gateSections — kirish darvozalarida ko'rsatiladigan bo'lim nomlari
// ----------------------------------------------------------------------------
// NEGA ALOHIDA FAYL: bu nomlarni ikkita komponent ishlatadi —
// `ProAccessGate` (PRO talab qiladigan bo'limlar) va `AuthSectionGate`
// (faqat ro'yxatdan o'tish talab qiladiganlar). Konstantani komponent
// faylidan eksport qilish React Fast Refresh ni buzadi, shuning uchun
// u shu yerda turadi.
// ============================================================================

export type GateSection =
  | "mavzuli"
  | "darslik"
  | "qidirish"
  | "xatolarim"
  | "xatolarTesti"
  | "qiyinSavollar";

/** Bo'lim nomi uch tilda — gate matnining ichiga qo'yiladi. */
export const SECTION_LABEL: Record<GateSection, { uz_lat: string; uz_cyr: string; ru: string }> = {
  mavzuli: { uz_lat: "Mavzular", uz_cyr: "Мавзулар", ru: "Темы" },
  darslik: { uz_lat: "Video darslik", uz_cyr: "Видео дарслик", ru: "Видеоуроки" },
  qidirish: { uz_lat: "Savol qidirish", uz_cyr: "Савол қидириш", ru: "Поиск вопросов" },
  xatolarim: { uz_lat: "Xato savollarim", uz_cyr: "Хато саволларим", ru: "Мои ошибки" },
  xatolarTesti: {
    uz_lat: "Xatolar ustida ishlash",
    uz_cyr: "Хатолар устида ишлаш",
    ru: "Работа над ошибками",
  },
  qiyinSavollar: {
    uz_lat: "Qiyin savollar",
    uz_cyr: "Қийин саволлар",
    ru: "Сложные вопросы",
  },
};
