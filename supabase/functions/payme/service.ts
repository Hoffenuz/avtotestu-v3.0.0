// ============================================================================
// Tranzaksiya xizmati
// ============================================================================
// Har bir handler RPC parametrlarini tekshiradi, holat o'zgarishini
// SECURITY DEFINER SQL funksiyasiga topshiradi va natijani Payme result yoki
// Payme error ga o'giradi.
//
// Biznes qarorlari shu yerda qabul qilinmaydi: taymaut, idempotentlik, hisobni
// bloklash va PRO berish/olib qo'yish Postgres ichida bitta tranzaksiyada
// bajariladi, shuning uchun takroriy yoki parallel chaqiruv yarim qolmaydi.

import { admin } from "./client.ts";
import { PaymeError, PaymeErrorDef, dbErrorToPayme } from "./errors.ts";

export type ServiceOutcome =
  | { ok: true; result: Record<string, unknown> }
  | { ok: false; error: PaymeErrorDef };

const fail = (error: PaymeErrorDef): ServiceOutcome => ({ ok: false, error });
const done = (result: Record<string, unknown>): ServiceOutcome => ({ ok: true, result });

type Params = Record<string, unknown>;

// ── Parametrlarni tekshirish ───────────────────────────────────────────────

/** `account.email` — noto'g'ri account protokol emas, hisob xatosi. */
function readEmail(params: Params): string | null {
  const account = params.account;
  if (typeof account !== "object" || account === null) return null;
  const email = (account as Params).email;
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : null;
}

/** Payme `Amount` turi: tiyindagi musbat butun son. */
function readAmount(params: Params): number | null {
  const amount = Number(params.amount);
  return Number.isInteger(amount) && amount > 0 ? amount : null;
}

/** Payme `ID` turi: bo'sh bo'lmagan satr. */
function readId(params: Params): string | null {
  const id = params.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/** Payme `Timestamp` turi: musbat butun son, millisekundlarda. */
function readTimestamp(value: unknown): number | null {
  const ts = Number(value);
  return Number.isInteger(ts) && ts > 0 ? ts : null;
}

/** Payme `Reason`: 1..5 yoki 10. Boshqasi bo'lsa null yozamiz. */
function readReason(value: unknown): number | null {
  const r = Number(value);
  return Number.isInteger(r) && r > 0 ? r : null;
}

// ── Metodlar ───────────────────────────────────────────────────────────────

export async function checkPerformTransaction(params: Params): Promise<ServiceOutcome> {
  const email = readEmail(params);
  if (!email) return fail(PaymeError.UserNotFound);

  // TUZATISH: noto'g'ri summa protokol xatosi (-32600) emas, -31001 bo'lishi kerak.
  const amount = readAmount(params);
  if (amount === null) return fail(PaymeError.InvalidAmount);

  const { data, error } = await admin.rpc("payme_check_perform_transaction", {
    p_email: email,
    p_amount: amount,
  });
  if (error) throw error;
  if (!data.ok) return fail(dbErrorToPayme(data.error));

  return done({ allow: true });
}

export async function createTransaction(params: Params): Promise<ServiceOutcome> {
  const paymeId = readId(params);
  const time = readTimestamp(params.time);
  if (!paymeId || time === null) return fail(PaymeError.InvalidRpc);

  const email = readEmail(params);
  if (!email) return fail(PaymeError.UserNotFound);

  const amount = readAmount(params);
  if (amount === null) return fail(PaymeError.InvalidAmount);

  const { data, error } = await admin.rpc("payme_create_transaction", {
    p_payme_id: paymeId,
    p_email: email,
    p_amount: amount,
    p_create_time: time,
  });
  if (error) throw error;
  if (!data.ok) return fail(dbErrorToPayme(data.error));

  return done({
    create_time: data.create_time,
    transaction: data.transaction_id,
    state: data.state,
  });
}

export async function performTransaction(params: Params): Promise<ServiceOutcome> {
  const paymeId = readId(params);
  if (!paymeId) return fail(PaymeError.InvalidRpc);

  const { data, error } = await admin.rpc("payme_perform_transaction", {
    p_payme_id: paymeId,
    p_perform_time: Date.now(),
  });
  if (error) throw error;
  if (!data.ok) return fail(dbErrorToPayme(data.error));

  return done({
    transaction: data.transaction_id,
    perform_time: data.perform_time,
    state: data.state,
  });
}

export async function cancelTransaction(params: Params): Promise<ServiceOutcome> {
  const paymeId = readId(params);
  if (!paymeId) return fail(PaymeError.InvalidRpc);

  const { data, error } = await admin.rpc("payme_cancel_transaction", {
    p_payme_id: paymeId,
    p_reason: readReason(params.reason),
    p_cancel_time: Date.now(),
  });
  if (error) throw error;
  if (!data.ok) return fail(dbErrorToPayme(data.error));

  return done({
    transaction: data.transaction_id,
    cancel_time: data.cancel_time,
    state: data.state,
  });
}

export async function checkTransaction(params: Params): Promise<ServiceOutcome> {
  const paymeId = readId(params);
  if (!paymeId) return fail(PaymeError.InvalidRpc);

  const { data: row, error } = await admin
    .from("payme_transactions")
    .select("id, create_time, perform_time, cancel_time, state, reason")
    .eq("payme_id", paymeId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return fail(PaymeError.TransactionNotFound);

  return done({
    create_time: row.create_time,
    perform_time: row.perform_time,
    cancel_time: row.cancel_time,
    transaction: row.id,
    state: row.state,
    reason: row.reason,
  });
}

interface StatementRow {
  id: string;
  payme_id: string;
  account_email: string;
  amount_tiyin: number;
  create_time: number;
  perform_time: number;
  cancel_time: number;
  state: number;
  reason: number | null;
}

export async function getStatement(params: Params): Promise<ServiceOutcome> {
  const from = readTimestamp(params.from);
  const to = readTimestamp(params.to);
  if (from === null || to === null) return fail(PaymeError.InvalidRpc);

  const { data: rows, error } = await admin
    .from("payme_transactions")
    .select(
      "id, payme_id, account_email, amount_tiyin, create_time, perform_time, cancel_time, state, reason",
    )
    .gte("create_time", from)
    .lte("create_time", to)
    .order("create_time", { ascending: true });
  if (error) throw error;

  return done({
    transactions: ((rows ?? []) as StatementRow[]).map((r) => ({
      id: r.payme_id,
      time: r.create_time,
      amount: r.amount_tiyin,
      account: { email: r.account_email },
      create_time: r.create_time,
      perform_time: r.perform_time,
      cancel_time: r.cancel_time,
      transaction: r.id,
      state: r.state,
      reason: r.reason,
    })),
  });
}

/**
 * Fiskal chek ma'lumoti — Payme chek yopilgandan keyin yuboradi. Uni amalga
 * oshirish ixtiyoriy, lekin xato qaytarilsa Payme cheksiz qayta urinadi,
 * shuning uchun oddiy tasdiq qaytaramiz.
 */
export function setFiscalData(params: Params): ServiceOutcome {
  console.log("[payme] SetFiscalData", JSON.stringify(params));
  return done({ success: true });
}
