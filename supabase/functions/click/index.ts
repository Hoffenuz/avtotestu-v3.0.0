// ============================================================================
// click — CLICK SHOP API (Prepare / Complete) endpoint
// https://docs.click.uz/en/shop-api/requests
// https://docs.click.uz/en/shop-api/errors
// ----------------------------------------------------------------------------
// CLICK kabinetida (shablondagi routes/index.js kabi):
//   Prepare URL:  https://<project-ref>.supabase.co/functions/v1/click/prepare
//   Complete URL: https://<project-ref>.supabase.co/functions/v1/click/complete
// Bitta URL (…/functions/v1/click) ham ishlaydi — bosqich `action` dan olinadi.
//
// Tuzilma:
//   enum.ts         — xato kodlari, action, holatlar
//   errors.ts       — error_note matnlari va javob formati
//   click-check.ts  — imzo tekshiruvi (kalit Vault da)
//   client.ts       — service-role Supabase klienti
//   service.ts      — prepare / complete
//   index.ts        — HTTP kirish nuqtasi va routing (controller)
//
// So'rov: POST, application/x-www-form-urlencoded. Javob: application/json,
// har doim HTTP 200.
//
// verify_jwt = false: CLICK Supabase JWT yubormaydi, u imzo bilan kiradi.
// ============================================================================

import { ClickAction, ClickError } from "./enum.ts";
import { type ClickReply, clickReply } from "./errors.ts";
import { complete, prepare } from "./service.ts";

const respond = (body: ClickReply) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });

/** Tana: hujjat bo'yicha urlencoded; JSON ham qabul qilinadi. */
async function readParams(req: Request): Promise<Record<string, string>> {
  const raw = await req.text();
  const out: Record<string, string> = {};

  if ((req.headers.get("content-type") ?? "").includes("application/json")) {
    const body = JSON.parse(raw) as Record<string, unknown> | null;
    for (const [k, v] of Object.entries(body ?? {})) {
      if (v !== null && v !== undefined) out[k] = String(v);
    }
    return out;
  }

  for (const [k, v] of new URLSearchParams(raw)) out[k] = v;
  return out;
}

/** `/click/prepare` → "0", `/click/complete` → "1", `/click` → action dan. */
function routeAction(req: Request, params: Record<string, string>): string {
  const last = new URL(req.url).pathname.split("/").filter(Boolean).pop();
  if (last === "prepare") return ClickAction.Prepare;
  if (last === "complete") return ClickAction.Complete;
  return params.action ?? "";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return respond(clickReply({}, ClickError.BadRequest));
  }

  let params: Record<string, string>;
  try {
    params = await readParams(req);
  } catch {
    return respond(clickReply({}, ClickError.BadRequest));
  }

  // Diagnostika uchun: Supabase loglarida har bir chaqiruv ko'rinadi.
  console.log(`[click] -> ${JSON.stringify(params)}`);

  const action = routeAction(req, params);

  try {
    let reply: ClickReply;
    if (action === ClickAction.Prepare) {
      reply = await prepare(params);
    } else if (action === ClickAction.Complete) {
      reply = await complete(params);
    } else {
      reply = clickReply(params, ClickError.ActionNotFound);
    }

    console.log(`[click] <- ${JSON.stringify(reply)}`);
    return respond(reply);
  } catch (err) {
    // Baza/tarmoq xatosi — biznes rad javobi emas. CLICK xato javobdan keyin
    // qayta urinadi; -7 shu qayta urinishga imkon beradi.
    console.error("[click] failed:", err);
    return respond(clickReply(params, ClickError.UpdateFailed));
  }
});
