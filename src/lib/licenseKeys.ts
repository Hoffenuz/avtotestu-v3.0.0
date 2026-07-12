// ============================================================================
// licenseKeys.ts — Litsenziya OCHIQ (public) kaliti
// ----------------------------------------------------------------------------
// Bu faqat OCHIQ kalit — uni ilovaga joylash xavfsiz. Maxfiy (private) kalit
// hech qachon bu yerda yoki ilovada bo'lmaydi; u faqat serverda (Edge Function
// `LICENSE_PRIVATE_KEY` secret) saqlanadi va imzolash uchun ishlatiladi.
//
// Imzo algoritmi: Ed25519 (asimmetrik). Ilova faqat ochiq kalit bilan imzoni
// tekshiradi — soxta kalit yasay olmaydi.
// ============================================================================

/** Ed25519 ochiq kalit (32 bayt, hex). */
export const LICENSE_PUBLIC_KEY_HEX =
  "3e817b92b5c4406bcf11499a3b9259550471fbba7e9f072d0a3eb597cd72b11b";

/** Token prefiksi (versiya). AVT2 = Ed25519 asimmetrik imzo. */
export const TOKEN_PREFIX = "AVT2";
