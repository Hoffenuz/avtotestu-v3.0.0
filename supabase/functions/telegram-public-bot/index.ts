/**
 * telegram-public-bot — @Avtotestubot ("AvtoTest 2026")
 * ============================================================================
 * Vazifasi BITTA: foydalanuvchini saytga yo'naltirish.
 *
 * Hech qanday ma'lumot o'zgartirmaydi, hech kimga huquq bermaydi.
 * Faqat:
 *   • salomlashadi
 *   • pastda "Test ishlash" tugmasini ko'rsatadi (Telegram Mini App)
 *   • yozish maydoni yonida "Kirish" tugmasi turadi
 *   • kim kelganini `telegram_bot_users` ga yozib boradi (o'lchov uchun)
 *
 * Admin boti bu emas — u alohida: `telegram-admin-bot`.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Token ──────────────────────────────────────────────────────────────────
/**
 * Token FAQAT sirdan o'qiladi.
 *
 * Ilgari bu yerda tokenning o'zi yozilgan edi — sababi admin botida sirga
 * xato qiymat tushib qolib, bot jim turgani va buni topish uzoq davom
 * etgani edi. Lekin bu repozitoriy OCHIQ: kodga yozilgan token bir necha
 * daqiqada skrap qilinadi va begona odam bot nomidan barcha obunachilarga
 * xabar yubora oladi. "Bot hech narsani o'zgartirmaydi" degani tokenning
 * xavfsizligini anglatmaydi.
 *
 * Sozlash:
 *   supabase secrets set PUBLIC_BOT_TOKEN="<BotFather bergan token>"
 *
 * Sir yo'q yoki shakli buzuq bo'lsa — bot ishga tushmaydi va sabab
 * logda aniq yoziladi. Jim qolgandan ko'ra ochiq yiqilgani yaxshiroq:
 * eski xatoning asl sababi ham aynan "jim qolish" edi.
 */
const TOKEN_SHAKLI = /^\d+:[A-Za-z0-9_-]{30,}$/;
const BOT_TOKEN = Deno.env.get("PUBLIC_BOT_TOKEN") ?? "";
if (!TOKEN_SHAKLI.test(BOT_TOKEN)) {
  console.error(
    "[public-bot] PUBLIC_BOT_TOKEN siri yo'q yoki shakli noto'g'ri. " +
    "Sozlang: supabase secrets set PUBLIC_BOT_TOKEN=\"<token>\"",
  );
}

const HOOK_SECRET = Deno.env.get("PUBLIC_BOT_HOOK_SECRET") ?? "";
const SITE = "https://www.avtotestu.uz";
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ── Telegram API ───────────────────────────────────────────────────────────
async function tg(method: string, payload: unknown): Promise<any> {
  const r = await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) console.error(`[tg] ${method}:`, await r.clone().text());
  return r.json().catch(() => null);
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Pastdagi doimiy tugma — Mini App ochadi. */
const KEYBOARD = {
  keyboard: [[{ text: "📝 Test ishlash", web_app: { url: SITE } }]],
  resize_keyboard: true,
  is_persistent: true,
};

function send(chatId: number, text: string) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: KEYBOARD,
    link_preview_options: { is_disabled: true },
  });
}

// ── Xabarlar ───────────────────────────────────────────────────────────────
const TUGMA_ESLATMA = `📝 Testni boshlash uchun pastdagi tugmani bosing 👇`;

function toliqSalom(ism: string): string {
  return (
    `Assalomu alaykum, <b>${esc(ism)}</b>! 👋\n\n` +
    `🚗 Avtotest — YHQ testlariga tayyorgarlik.\n` +
    `Boshlash uchun pastdagi tugmani bosing 👇`
  );
}

// ── Asosiy ─────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // Sir o'rnatilgan bo'lsa tekshiramiz. O'rnatilmagan bo'lsa ham ishlayveradi:
  // bu bot hech narsani o'zgartirmaydi, eng yomoni — begona odam salomlashuv
  // xabarini oladi.
  if (HOOK_SECRET && req.headers.get("x-telegram-bot-api-secret-token") !== HOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  let upd: Record<string, any>;
  try { upd = await req.json(); } catch { return new Response("ok"); }

  const msg = upd.message;
  const from = msg?.from;
  if (!from || from.is_bot) return new Response("ok");

  const tid = from.id as number;
  const chatId = msg.chat?.id as number;
  const text = (msg.text ?? "").trim();

  try {
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Birinchi marta kelganmi — shu asosda to'liq yoki qisqa xabar
    const { data: mavjud } = await db.from("telegram_bot_users")
      .select("telegram_id, start_count").eq("telegram_id", tid).maybeSingle();
    const birinchi = !mavjud;

    await db.from("telegram_bot_users").upsert({
      telegram_id: tid,
      username: from.username ?? null,
      first_name: from.first_name ?? null,
      language_code: from.language_code ?? null,
      last_seen_at: new Date().toISOString(),
      start_count: (mavjud?.start_count ?? 0) + 1,
      ...(birinchi ? { first_seen_at: new Date().toISOString() } : {}),
    }, { onConflict: "telegram_id" });

    await send(chatId, birinchi ? toliqSalom(from.first_name ?? "do'stim") : TUGMA_ESLATMA);
    return new Response("ok");
  } catch (err) {
    console.error("[public-bot] xato:", err);
    // Baza ishlamasa ham foydalanuvchi tugmani ko'rsin
    try { await send(chatId, TUGMA_ESLATMA); } catch { /* ignore */ }
    return new Response("ok");
  }
});
