// VAQTINCHALIK tashxis: admin bot (@Avtotesturganchbot) webhook holati.
//
// 2026-10-18: bot tugmalari javob bermadi — telegram-admin-bot loglarida
// 17-oktabr 19:29 UTC dan keyin birorta so'rov yo'q (xato emas, umuman yo'q).
// Ya'ni Telegram update'larni bizga yubormayapti: webhook o'chgan yoki
// boshqa manzilga o'tgan.
//
//   ?action=info — getWebhookInfo (url, kutilayotgan update'lar, oxirgi xato)
//   ?action=fix  — webhookni telegram-admin-bot ga, o'sha secret_token bilan qaytaradi
//
// Token javobga HECH QACHON chiqmaydi. Ishlatilgach shu fayl 410 stubiga qaytariladi.
const TOKEN_SHAKLI = /^\d+:[A-Za-z0-9_-]{30,}$/;
const adminToken = Deno.env.get("ADMIN_BOT_TOKEN") ?? "";
const TOKEN = TOKEN_SHAKLI.test(adminToken) ? adminToken : (Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "");
const HOOK_SECRET = Deno.env.get("ADMIN_BOT_HOOK_SECRET") ?? "";
const HOOK_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-admin-bot`;

async function tg(method: string, body?: unknown) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return await res.json();
}

const json = (b: unknown) =>
  new Response(JSON.stringify(b, null, 2), { headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const action = new URL(req.url).searchParams.get("action");
  const tokenOk = TOKEN_SHAKLI.test(TOKEN);
  if (!tokenOk) return json({ token_ok: false });

  if (action === "info") {
    const me = await tg("getMe");
    const info = await tg("getWebhookInfo");
    const r = info.result ?? {};
    return json({
      token_ok: true,
      bot: me.result?.username,
      hook_secret_set: HOOK_SECRET.length > 0,
      expected_url: HOOK_URL,
      url: r.url,
      url_matches: r.url === HOOK_URL,
      pending_update_count: r.pending_update_count,
      last_error_date: r.last_error_date ? new Date(r.last_error_date * 1000).toISOString() : null,
      last_error_message: r.last_error_message ?? null,
      allowed_updates: r.allowed_updates ?? null,
      ip_address: r.ip_address ?? null,
    });
  }

  if (action === "fix") {
    if (!HOOK_SECRET) return json({ ok: false, error: "ADMIN_BOT_HOOK_SECRET yo'q" });
    const set = await tg("setWebhook", {
      url: HOOK_URL,
      secret_token: HOOK_SECRET,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    });
    const info = await tg("getWebhookInfo");
    return json({
      set_ok: set.ok,
      set_description: set.description,
      url_matches: info.result?.url === HOOK_URL,
      pending_update_count: info.result?.pending_update_count,
    });
  }

  return json({ actions: ["info", "fix"] });
});
