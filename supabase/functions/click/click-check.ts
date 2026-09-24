// ============================================================================
// Imzo tekshiruvi (shablondagi utils/click-check.js)
// https://docs.click.uz/en/shop-api/requests
// ============================================================================
// Prepare:  md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
// Complete: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
//
// Shablondan farqi: SECRET_KEY .env da emas — Supabase Vault da
// (`click_secret_key`) turadi va md5 Postgres ichida hisoblanadi, ya'ni
// kalit bu funksiyaga umuman tushmaydi (Payme kaliti bilan bir xil).
//
// Imzo XOM satrlar ustida hisoblanadi — "35000.00" ni 35000 ga o'girish
// yoki bo'shliqlarni kesish imzoni buzadi.

import { admin } from "./client.ts";
import { ClickAction } from "./enum.ts";

/**
 * `true` — imzo to'g'ri, `false` — noto'g'ri,
 * `null` — Vault da `click_secret_key` sozlanmagan.
 */
export async function clickCheckToken(p: Record<string, string>): Promise<boolean | null> {
  const { data, error } = await admin.rpc("click_verify_sign", {
    p_click_trans_id: p.click_trans_id,
    p_service_id: p.service_id,
    p_merchant_trans_id: p.merchant_trans_id,
    p_merchant_prepare_id: p.action === ClickAction.Complete ? p.merchant_prepare_id : "",
    p_amount: p.amount,
    p_action: p.action,
    p_sign_time: p.sign_time,
    p_sign_string: p.sign_string,
  });
  if (error) throw error;
  return data as boolean | null;
}
