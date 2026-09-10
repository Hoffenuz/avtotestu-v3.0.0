// ============================================================================
// Payme Merchant API — konstantalar
// https://developer.help.paycom.uz/metody-merchant-api/tipy-dannykh
// ============================================================================

export const PaymeMethod = {
  CheckPerformTransaction: "CheckPerformTransaction",
  CreateTransaction: "CreateTransaction",
  PerformTransaction: "PerformTransaction",
  CancelTransaction: "CancelTransaction",
  CheckTransaction: "CheckTransaction",
  GetStatement: "GetStatement",
  SetFiscalData: "SetFiscalData",
} as const;

/** Tranzaksiya holatlari ("Типы данных" bo'limi). */
export const TransactionState = {
  /** Yaratildi, tasdiq kutilmoqda. */
  Pending: 1,
  /** Muvaffaqiyatli yakunlandi. */
  Paid: 2,
  /** Kutish holatida bekor qilindi. */
  PendingCanceled: -1,
  /** Yakunlangandan keyin bekor qilindi (pul qaytarish). */
  PaidCanceled: -2,
} as const;

/** Bekor qilish sabablari ("Типы данных" bo'limi). */
export const CancelReason = {
  ReceiverNotFound: 1,
  DebitError: 2,
  ExecutionError: 3,
  Timeout: 4,
  Refund: 5,
  Unknown: 10,
} as const;

/**
 * Tranzaksiya yaratilgandan 12 soat keyin taymaut bo'yicha bekor qilinadi.
 * "Отмена транзакции по таймауту производится через 12 часов — 43 200 000 миллисекунд"
 */
export const TRANSACTION_TIMEOUT_MS = 43_200_000;
