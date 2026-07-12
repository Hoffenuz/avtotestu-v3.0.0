/** UI da ko'rsatiladigan bepul variant raqami */
export const FREE_VARIANT_UI = 1;

/** Bepul variant uchun yuklanadigan JSON fayl (v59.json) */
export const FREE_VARIANT_DATA = 59;

export function isFreeVariantUi(variant: number, hasProAccess: boolean): boolean {
  return !hasProAccess && variant === FREE_VARIANT_UI;
}

export function isVariantLocked(variant: number, hasProAccess: boolean): boolean {
  return !hasProAccess && variant !== FREE_VARIANT_UI;
}

/** UI variant raqamidan JSON fayl raqamiga */
export function getVariantDataId(uiVariant: number, hasProAccess: boolean): number {
  if (isFreeVariantUi(uiVariant, hasProAccess)) return FREE_VARIANT_DATA;
  return uiVariant;
}

export function getVariantQuestionPath(uiVariant: number, hasProAccess: boolean): string {
  return `/data/variants/v${getVariantDataId(uiVariant, hasProAccess)}.json`;
}
