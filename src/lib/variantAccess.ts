/**
 * Bepul foydalanuvchiga ochiq variantlar (UI raqamlari).
 *
 * 2026-09: 1 tadan 3 taga oshirildi — bitta variant sinab ko'rish uchun
 * juda kam edi. Server bepul foydalanuvchining variant raqamini
 * cheklamaydi (`start_test_session` faqat PRO sessiyani tekshiradi), ya'ni
 * qulf faqat shu yerda.
 */
export const FREE_VARIANTS_UI: readonly number[] = [1, 2, 3];

/** Bepul foydalanuvchida oldindan tanlanadigan variant. */
export const FREE_VARIANT_UI = 1;

/**
 * Bepul "1-variant" uchun yuklanadigan JSON fayl (v59.json).
 *
 * TARIXIY: birinchi versiyadan beri bepul 1-variant v59 savollari bilan
 * ishlaydi va /savol SEO sahifalari ham shu to'plamdan qurilgan — mavjud
 * foydalanuvchilarga "1-variant" o'zgarib qolmasligi uchun tegilmadi.
 * 2- va 3-variant o'z fayllari (v2, v3): ular 20/20 bepul bazadan
 * (`public/free-*.json`) — PRO savollari ochilib qolmaydi.
 */
export const FREE_VARIANT_DATA = 59;

export function isFreeVariantUi(variant: number, hasProAccess: boolean): boolean {
  return !hasProAccess && FREE_VARIANTS_UI.includes(variant);
}

export function isVariantLocked(variant: number, hasProAccess: boolean): boolean {
  return !hasProAccess && !FREE_VARIANTS_UI.includes(variant);
}

/** UI variant raqamidan JSON fayl raqamiga */
export function getVariantDataId(uiVariant: number, hasProAccess: boolean): number {
  if (!hasProAccess && uiVariant === FREE_VARIANT_UI) return FREE_VARIANT_DATA;
  return uiVariant;
}

export function getVariantQuestionPath(uiVariant: number, hasProAccess: boolean): string {
  return `/data/variants/v${getVariantDataId(uiVariant, hasProAccess)}.json`;
}
