// ============================================================================
// CLICK xizmati (shablondagi services/click.service.js)
// ============================================================================
// Tekshiruvlar tartibi:
//   1. majburiy parametrlar va ularning turi      → -8
//   2. action ma'lum va marshrutga mos             → -3
//   3. imzo (md5 + SECRET_KEY)                     → -1
//   4. service_id bizniki                          → -8
//   5. buyurtma holati, summa, PRO berish — SQL    → 0 / -2 / -4 / -5 / -6 / -9
//
// Shablondagi xatolar ko'chirilmadi: mavjud bo'lmagan `Canceled` holati,
// `order.premium`, buyurtma topilmasa Complete da yiqilish, Complete da
// error < 0 bo'lsa -6 qaytarish (hujjat bo'yicha -9), va har Prepare da
// yangi tranzaksiya yozilishi (bu yerda Prepare idempotent).

import { admin } from "./client.ts";
import { clickCheckToken } from "./click-check.ts";
import { CLICK_SERVICE_ID, ClickAction, type ClickActionValue, ClickError } from "./enum.ts";
import { type ClickReply, clickReply, isClickErrorCode } from "./errors.ts";

type Params = Record<string, string>;

const COMMON_FIELDS = [
  "click_trans_id",
  "service_id",
  "click_paydoc_id",
  "merchant_trans_id",
  "amount",
  "action",
  "error",
  "sign_time",
  "sign_string",
] as const;

const isId = (v: string | undefined) => /^\d{1,18}$/.test(v ?? "");
const isInt = (v: string | undefined) => /^-?\d{1,9}$/.test(v ?? "");

/** Imzo va umumiy tekshiruvlar. Muammo bo'lsa tayyor javob qaytaradi. */
async function precheck(p: Params, expected: ClickActionValue): Promise<ClickReply | null> {
  const fields = expected === ClickAction.Complete
    ? [...COMMON_FIELDS, "merchant_prepare_id"]
    : COMMON_FIELDS;
  for (const key of fields) {
    if (typeof p[key] !== "string" || p[key] === "") {
      console.warn(`[click] missing ${key}`);
      return clickReply(p, ClickError.BadRequest);
    }
  }

  if (
    !isId(p.click_trans_id) || !isId(p.service_id) || !isId(p.click_paydoc_id) ||
    !isInt(p.error) || (expected === ClickAction.Complete && !isId(p.merchant_prepare_id))
  ) {
    return clickReply(p, ClickError.BadRequest);
  }

  if (p.action !== expected) {
    return clickReply(p, ClickError.ActionNotFound);
  }

  const signOk = await clickCheckToken(p);
  if (signOk === null) {
    console.error("[click] click_secret_key Vault da sozlanmagan");
    return clickReply(p, ClickError.SignFailed);
  }
  if (!signOk) {
    return clickReply(p, ClickError.SignFailed);
  }

  if (p.service_id !== CLICK_SERVICE_ID) {
    return clickReply(p, ClickError.BadRequest);
  }

  return null;
}

/** SQL natijasi → javob. Kutilmagan natija tizim xatosi hisoblanadi. */
function fromDb(
  p: Params,
  data: unknown,
  idKey: "merchant_prepare_id" | "merchant_confirm_id",
): ClickReply {
  const row = data as Record<string, unknown> | null;
  const code = row?.error;
  if (!isClickErrorCode(code)) {
    throw new Error(`unexpected db result: ${JSON.stringify(data)}`);
  }
  if (code !== ClickError.Success) return clickReply(p, code);

  const id = Number(row?.[idKey]);
  if (!Number.isInteger(id)) {
    throw new Error(`missing ${idKey}: ${JSON.stringify(data)}`);
  }
  return clickReply(
    p,
    ClickError.Success,
    idKey === "merchant_prepare_id" ? { merchant_prepare_id: id } : { merchant_confirm_id: id },
  );
}

/** Prepare (action = 0) — buyurtma va summani tekshiradi, band qiladi. */
export async function prepare(p: Params): Promise<ClickReply> {
  const rejected = await precheck(p, ClickAction.Prepare);
  if (rejected) return rejected;

  const { data, error } = await admin.rpc("click_prepare", {
    p_click_trans_id: p.click_trans_id,
    p_click_paydoc_id: p.click_paydoc_id,
    p_merchant_trans_id: p.merchant_trans_id,
    p_amount: p.amount,
    p_error: Number(p.error),
  });
  if (error) throw error;

  return fromDb(p, data, "merchant_prepare_id");
}

/** Complete (action = 1) — to'lovni yakunlaydi va PRO beradi. */
export async function complete(p: Params): Promise<ClickReply> {
  const rejected = await precheck(p, ClickAction.Complete);
  if (rejected) return rejected;

  const { data, error } = await admin.rpc("click_complete", {
    p_click_trans_id: p.click_trans_id,
    p_click_paydoc_id: p.click_paydoc_id,
    p_merchant_trans_id: p.merchant_trans_id,
    p_merchant_prepare_id: p.merchant_prepare_id,
    p_amount: p.amount,
    p_error: Number(p.error),
    p_error_note: p.error_note ?? "",
  });
  if (error) throw error;

  return fromDb(p, data, "merchant_confirm_id");
}
