// ============================================================================
// payme — Payme Merchant API (JSON-RPC 2.0) endpoint
// ----------------------------------------------------------------------------
// Payme kabinetida ro'yxatdan o'tkaziladigan URL:
//   https://<project-ref>.supabase.co/functions/v1/payme
//
// Tuzilma:
//   enum.ts     — metodlar, holatlar, bekor qilish sabablari, taymaut
//   errors.ts   — xatolar katalogi + JSON-RPC konvertlari
//   auth.ts     — Basic auth (kalit Supabase Vault ichida)
//   client.ts   — service-role Supabase klienti
//   service.ts  — metodlar mantiqi, holat o'zgarishi SQL ichida
//   index.ts    — HTTP kirish nuqtasi va routing
//
// verify_jwt = false: Payme Supabase JWT emas, HTTP Basic bilan kiradi.
// Har bir javob HTTP 200 va so'rovdagi `id` ni qaytaradi.
// ============================================================================

import { PaymeMethod } from "./enum.ts";
import { PaymeError, rpcError, rpcResult } from "./errors.ts";
import { isAuthorized } from "./auth.ts";
import {
  cancelTransaction,
  checkPerformTransaction,
  checkTransaction,
  createTransaction,
  getStatement,
  performTransaction,
  type ServiceOutcome,
  setFiscalData,
} from "./service.ts";

const respond = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return respond(rpcError(null, PaymeError.NotPost));
  }

  let body: { method?: unknown; params?: unknown; id?: unknown };
  let raw = "";
  try {
    raw = await req.text();
    body = JSON.parse(raw);
  } catch {
    return respond(rpcError(null, PaymeError.ParseError));
  }

  const id = body?.id ?? null;

  if (!(await isAuthorized(req))) {
    console.warn("[payme] auth rejected");
    return respond(rpcError(id, PaymeError.InvalidAuthorization));
  }

  const method = body?.method;
  if (typeof method !== "string") {
    return respond(rpcError(id, PaymeError.InvalidRpc));
  }

  // `params` konvertda ixtiyoriy, lekin bo'lsa obyekt bo'lishi kerak.
  const rawParams = body?.params ?? {};
  if (typeof rawParams !== "object" || rawParams === null || Array.isArray(rawParams)) {
    return respond(rpcError(id, PaymeError.InvalidRpc));
  }
  const params = rawParams as Record<string, unknown>;

  // Diagnostika uchun: Supabase loglarida har bir chaqiruv ko'rinadi.
  console.log(`[payme] -> ${method} ${JSON.stringify(params)}`);

  try {
    let outcome: ServiceOutcome;

    switch (method) {
      case PaymeMethod.CheckPerformTransaction:
        outcome = await checkPerformTransaction(params);
        break;
      case PaymeMethod.CreateTransaction:
        outcome = await createTransaction(params);
        break;
      case PaymeMethod.PerformTransaction:
        outcome = await performTransaction(params);
        break;
      case PaymeMethod.CancelTransaction:
        outcome = await cancelTransaction(params);
        break;
      case PaymeMethod.CheckTransaction:
        outcome = await checkTransaction(params);
        break;
      case PaymeMethod.GetStatement:
        outcome = await getStatement(params);
        break;
      case PaymeMethod.SetFiscalData:
        outcome = setFiscalData(params);
        break;
      default:
        console.warn(`[payme] <- ${method} method_not_found`);
        return respond(rpcError(id, PaymeError.MethodNotFound));
    }

    if (outcome.ok) {
      console.log(`[payme] <- ${method} OK ${JSON.stringify(outcome.result)}`);
      return respond(rpcResult(id, outcome.result));
    }

    console.warn(`[payme] <- ${method} ERR ${outcome.error.code}`);
    return respond(rpcError(id, outcome.error));
  } catch (err) {
    // Baza/tarmoq xatosi — biznes rad javobi emas, tizim xatosi.
    console.error(`[payme] ${method} failed:`, err);
    return respond(rpcError(id, PaymeError.InternalError));
  }
});
