// ============================================================================
// CLICK SHOP API — javob formati va xato izohlari
// https://docs.click.uz/en/shop-api/errors
// ============================================================================

import { ClickError, type ClickErrorCode } from "./enum.ts";

/** `error_note` — hujjatdagi matnlar bilan aynan bir xil. */
export const ERROR_NOTE: Record<ClickErrorCode, string> = {
  [ClickError.Success]: "Success",
  [ClickError.SignFailed]: "SIGN CHECK FAILED!",
  [ClickError.InvalidAmount]: "Incorrect parameter amount",
  [ClickError.ActionNotFound]: "Action not found",
  [ClickError.AlreadyPaid]: "Already paid",
  [ClickError.UserNotFound]: "User does not exist",
  [ClickError.TransactionNotFound]: "Transaction does not exist",
  [ClickError.UpdateFailed]: "Failed to update user",
  [ClickError.BadRequest]: "Error in request from click",
  [ClickError.TransactionCanceled]: "Transaction cancelled",
};

export function isClickErrorCode(value: unknown): value is ClickErrorCode {
  return typeof value === "number" && value in ERROR_NOTE;
}

export interface ClickReply {
  click_trans_id?: number;
  merchant_trans_id?: string;
  merchant_prepare_id?: number;
  merchant_confirm_id?: number;
  error: ClickErrorCode;
  error_note: string;
}

/**
 * Javob: har doim `error` + `error_note`, bo'lsa `click_trans_id` va
 * `merchant_trans_id` qaytariladi (CLICK javobni so'rov bilan moslaydi).
 */
export function clickReply(
  params: Record<string, string>,
  error: ClickErrorCode,
  extra: Pick<ClickReply, "merchant_prepare_id" | "merchant_confirm_id"> = {},
): ClickReply {
  const reply: ClickReply = { error, error_note: ERROR_NOTE[error] };
  if (/^\d{1,18}$/.test(params.click_trans_id ?? "")) {
    reply.click_trans_id = Number(params.click_trans_id);
  }
  if (params.merchant_trans_id) reply.merchant_trans_id = params.merchant_trans_id;
  return { ...reply, ...extra };
}
