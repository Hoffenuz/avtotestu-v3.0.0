// ============================================================================
// CLICK SHOP API — konstantalar
// https://docs.click.uz/en/shop-api/errors
// Shablon: click-uz-integration-nodejs/enum/transaction.enum.js
// ============================================================================

/** Merchant (bizning) tomondan qaytariladigan xato kodlari. */
export const ClickError = {
  Success: 0,
  SignFailed: -1,
  InvalidAmount: -2,
  ActionNotFound: -3,
  AlreadyPaid: -4,
  UserNotFound: -5,
  TransactionNotFound: -6,
  UpdateFailed: -7,
  BadRequest: -8,
  TransactionCanceled: -9,
} as const;

export type ClickErrorCode = (typeof ClickError)[keyof typeof ClickError];

/** `action` parametri. */
export const ClickAction = {
  Prepare: "0",
  Complete: "1",
} as const;

export type ClickActionValue = (typeof ClickAction)[keyof typeof ClickAction];

/**
 * `click_transactions.state` — holat o'zgarishi SQL ichida bajariladi, bu
 * yerda faqat ma'lumot uchun (shablondagi TransactionState + "yaratildi").
 */
export const TransactionState = {
  Created: 0,
  Pending: 1,
  Paid: 2,
  PendingCanceled: -1,
  PaidCanceled: -2,
} as const;

/** Kassa xizmati ID si (maxfiy emas). Kabinetdagi SERVICE_ID. */
export const CLICK_SERVICE_ID = Deno.env.get("CLICK_SERVICE_ID") ?? "112576";
