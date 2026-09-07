/**
 * telegram-admin-bot — Avtotestu.uz admin boti
 * ============================================================================
 * Telegram webhook. Uchta ish qiladi:
 *   1. To'lov statistikasi (kunlik / oylik / oxirgi to'lovlar)
 *   2. Foydalanuvchiga PRO berish (muddat tanlanadi)
 *   3. Parolni o'zgartirish (FAQAT super_admin)
 *
 * KIRISH:
 *   Bir marta `/kirish <email> <parol>` — saytdagi hisob bilan.
 *   Shundan keyin Telegram hisobi TANIB OLINADI, qayta kirish shart emas.
 *
 * XAVFSIZLIK — uch qatlam:
 *   1. Telegram `secret_token` sarlavhasi (begona so'rov kirmaydi)
 *   2. `telegram_admins` jadvali (faqat tanilgan Telegram hisoblari)
 *   3. Rol tekshiruvi (parol uchun super_admin talab qilinadi)
 *
 * Har bir o'zgartiruvchi amal `audit_logs` ga yoziladi.
 * Parol MATNI hech qayerga yozilmaydi — na logga, na bazaga.
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Sozlamalar ─────────────────────────────────────────────────────────────
/**
 * Token: avval `ADMIN_BOT_TOKEN`, u haqiqiy ko'rinishda bo'lmasa
 * `TELEGRAM_BOT_TOKEN`.
 *
 * NEGA shakl tekshiriladi: sirga token o'rniga hujjatdagi o'rin
 * egallovchi matn (`<BotFather bergan token>`) yozilib qolgan edi.
 * Sir "bor" edi, lekin Telegram har bir so'rovga 404 qaytarardi va
 * bot jim turardi — sababi loglarsiz ko'rinmaydi.
 */
const TOKEN_SHAKLI = /^\d+:[A-Za-z0-9_-]{30,}$/;
const _adminToken = Deno.env.get("ADMIN_BOT_TOKEN") ?? "";
const BOT_TOKEN   = TOKEN_SHAKLI.test(_adminToken)
  ? _adminToken
  : (Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "");
if (!TOKEN_SHAKLI.test(BOT_TOKEN)) {
  console.error("[bot] ISHLAYDIGAN TOKEN YO'Q — ADMIN_BOT_TOKEN yoki TELEGRAM_BOT_TOKEN ni tekshiring");
}
const HOOK_SECRET = Deno.env.get("ADMIN_BOT_HOOK_SECRET")!;
const ANON_KEY    = Deno.env.get("SUPABASE_ANON_KEY")!;
const TG          = `https://api.telegram.org/bot${BOT_TOKEN}`;

/** Suhbat holati shuncha vaqtdan keyin eskirgan hisoblanadi. */
const STATE_TTL_MS = 15 * 60_000;

// ── Telegram API ───────────────────────────────────────────────────────────
async function tg(method: string, payload: unknown): Promise<any> {
  const r = await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) console.error(`[tg] ${method} xatosi:`, await r.clone().text());
  return r.json().catch(() => null);
}

/** HTML parse_mode uchun xavfsizlantirish. */
const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Btn = { text: string; callback_data: string };

function send(chatId: number, text: string, rows: Btn[][] = []) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: rows.length ? { inline_keyboard: rows } : undefined,
  });
}

function edit(chatId: number, msgId: number, text: string, rows: Btn[][] = []) {
  return tg("editMessageText", {
    chat_id: chatId,
    message_id: msgId,
    text,
    parse_mode: "HTML",
    reply_markup: rows.length ? { inline_keyboard: rows } : undefined,
  });
}

// ── Formatlash ─────────────────────────────────────────────────────────────
const som = (n: number) => Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ");

function sana(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

const PLAN: Record<string, string> = {
  weekly: "Haftalik", monthly: "Oylik", quarterly: "3 oylik", basic: "Admin bergan",
};

// ── Tarif tugash sanasi ────────────────────────────────────────────────────
/**
 * `bot-user-manager` va `admin-manager` dagi mantiq bilan AYNAN bir xil:
 * UTC+5 ga o'tkaziladi → kun boshiga qo'yiladi → N kun qo'shiladi →
 * 1 soniya ayiriladi (23:59:59) → UTC ga qaytariladi.
 *
 * Bir xil bo'lishi SHART: aks holda bot bergan muddat sayt hisoblagani
 * bilan mos kelmaydi va foydalanuvchi bir kun yo'qotadi yoki ortiq oladi.
 */
function tariffEnd(startIso: string, days: number): string {
  const TZ = 5 * 3_600_000;
  const t = new Date(new Date(startIso).getTime() + TZ);
  t.setUTCHours(0, 0, 0, 0);
  t.setUTCDate(t.getUTCDate() + days);
  t.setUTCSeconds(t.getUTCSeconds() - 1);
  return new Date(t.getTime() - TZ).toISOString();
}

// ── Foydalanuvchini topish ─────────────────────────────────────────────────
const UZ_CODE = "998";

/**
 * Kiritilgan matndan foydalanuvchi manzilini yasaydi.
 *
 * Telefon hisoblari bazada sun'iy manzil sifatida saqlanadi
 * (`998901234567@pro.com`), shuning uchun raqam ham, email ham qabul
 * qilinadi.
 *
 * DIQQAT: mamlakat kodi UZUNLIK bo'yicha ajratiladi, prefiks bo'yicha
 * emas — `99` amaldagi operator kodi, ya'ni 9 xonali raqamning o'zi
 * `998` bilan boshlanishi mumkin (99 812 34 56).
 */
function toEmail(input: string): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  if (raw.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw.toLowerCase() : null;
  }
  const d = raw.replace(/\D/g, "");
  let local: string;
  if (d.length === 9) local = d;
  else if (d.length === 12 && d.startsWith(UZ_CODE)) local = d.slice(3);
  else return null;
  if (/^[01]/.test(local)) return null;
  return `${UZ_CODE}${local}@pro.com`;
}

/** Ko'rsatish uchun: telefon hisobi bo'lsa raqam, aks holda email. */
function ko(email: string): string {
  if (!email.endsWith("@pro.com")) return email;
  const l = email.split("@")[0];
  if (!/^998\d{9}$/.test(l)) return email;
  const p = l.slice(3);
  return `+998 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5, 7)} ${p.slice(7, 9)}`;
}

// ── Holat (ko'p bosqichli suhbat) ──────────────────────────────────────────
type State = { step: string; data: Record<string, unknown> };

async function getState(db: SupabaseClient, tid: number): Promise<State | null> {
  const { data } = await db.from("telegram_bot_state")
    .select("step, data, updated_at").eq("telegram_id", tid).maybeSingle();
  if (!data) return null;
  if (Date.now() - new Date(data.updated_at).getTime() > STATE_TTL_MS) {
    await clearState(db, tid);
    return null;
  }
  return { step: data.step, data: data.data ?? {} };
}

async function setState(db: SupabaseClient, tid: number, step: string, d: Record<string, unknown>) {
  await db.from("telegram_bot_state").upsert(
    { telegram_id: tid, step, data: d, updated_at: new Date().toISOString() },
    { onConflict: "telegram_id" },
  );
}

const clearState = (db: SupabaseClient, tid: number) =>
  db.from("telegram_bot_state").delete().eq("telegram_id", tid);

// ── Audit ──────────────────────────────────────────────────────────────────
/** Parol MATNI hech qachon bu yerga tushmasligi kerak. */
async function audit(
  db: SupabaseClient, adminId: string, action: string, newValues: Record<string, unknown>,
) {
  const { error } = await db.from("audit_logs").insert({
    user_id: adminId, action, table_name: "telegram_admin_bot", new_values: newValues,
  });
  if (error) console.error("[audit] yozilmadi:", error.message);
}

// ── Menyular ───────────────────────────────────────────────────────────────
function mainMenu(isSuper: boolean): Btn[][] {
  const rows: Btn[][] = [
    [{ text: "💳 To'lovlar", callback_data: "m:pay" }],
    [{ text: "⭐ PRO berish", callback_data: "m:pro" }],
  ];
  if (isSuper) rows.push([{ text: "🔑 Parol o'zgartirish", callback_data: "m:pwd" }]);
  return rows;
}

const BACK: Btn[][] = [[{ text: "◀️ Asosiy menyu", callback_data: "m:home" }]];

// ── Asosiy ─────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // 1-qatlam: Telegram sirli sarlavhasi
  if (req.headers.get("x-telegram-bot-api-secret-token") !== HOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let upd: Record<string, any>;
  try { upd = await req.json(); } catch { return new Response("ok"); }

  const msg = upd.message ?? upd.edited_message;
  const cb  = upd.callback_query;
  const from = msg?.from ?? cb?.from;
  if (!from) return new Response("ok");

  const tid    = from.id as number;
  const chatId = (msg?.chat?.id ?? cb?.message?.chat?.id) as number;
  const text   = (msg?.text ?? "").trim();

  try {
    // ── 2-qatlam: ulangan adminmi ────────────────────────────────────────
    const { data: link } = await db.from("telegram_admins")
      .select("user_id").eq("telegram_id", tid).maybeSingle();

    // Tanilmagan — faqat /kirish ishlaydi
    if (!link) {
      if (text.startsWith("/kirish")) {
        // Parol yozilgan xabarni DARHOL o'chiramiz
        await tg("deleteMessage", { chat_id: chatId, message_id: msg.message_id });

        // Parol topishga urinishni cheklash
        const { data: att } = await db.from("telegram_login_attempts")
          .select("fails, blocked_until").eq("telegram_id", tid).maybeSingle();
        if (att?.blocked_until && new Date(att.blocked_until) > new Date()) {
          await send(chatId, "⛔️ Juda ko'p urinish. Bir soatdan keyin qayta urining.");
          return new Response("ok");
        }

        const [, em, pwd] = text.split(/\s+/);
        if (!em || !pwd) {
          await send(chatId,
            "Kirish:\n<code>/kirish email@example.com parol</code>\n\n" +
            "<i>Saytdagi admin hisobingiz bilan. Xabar avtomatik o'chiriladi.</i>");
          return new Response("ok");
        }

        // Parolni Supabase Auth ning o'zi tekshiradi
        const anon = createClient(Deno.env.get("SUPABASE_URL")!, ANON_KEY);
        const { data: sess, error: avErr } = await anon.auth.signInWithPassword({
          email: em.toLowerCase(), password: pwd,
        });

        if (avErr || !sess?.user) {
          const fails = (att?.fails ?? 0) + 1;
          await db.from("telegram_login_attempts").upsert({
            telegram_id: tid, fails, last_fail_at: new Date().toISOString(),
            blocked_until: fails >= 5
              ? new Date(Date.now() + 3_600_000).toISOString() : null,
          }, { onConflict: "telegram_id" });
          console.warn(`[bot] kirish rad etildi, telegram_id=${tid}, urinish=${fails}`);
          await send(chatId, `❌ Email yoki parol noto'g'ri. (${fails}/5)`);
          return new Response("ok");
        }

        // Rol tekshiruvi
        const { data: who0 } = await db.rpc("admin_role_of", { p_user_id: sess.user.id });
        const r0 = Array.isArray(who0) ? who0[0] : who0;
        if (r0?.role !== "admin" && r0?.role !== "super_admin") {
          await send(chatId, "❌ Bu hisobda admin huquqi yo'q.");
          return new Response("ok");
        }

        await db.from("telegram_admins").upsert({
          telegram_id: tid, user_id: sess.user.id,
          username: from.username ?? null, linked_at: new Date().toISOString(),
        }, { onConflict: "telegram_id" });
        await db.from("telegram_login_attempts").delete().eq("telegram_id", tid);
        await audit(db, sess.user.id, "telegram_link",
          { telegram_id: tid, username: from.username });

        await send(chatId,
          `✅ <b>Tanildingiz</b>

${esc(ko(r0.email))} · ${esc(r0.role)}

` +
          `Endi qayta kirish shart emas — Telegram hisobingiz eslab qolindi.`,
          mainMenu(r0.role === "super_admin"));
        return new Response("ok");
      }

      await send(chatId,
        "🔒 <b>Avtotestu admin boti</b>\n\nKirish uchun saytdagi admin hisobingizni yuboring:\n\n" +
        "<code>/kirish email@example.com parol</code>\n\n" +
        "<i>Xabar avtomatik o'chiriladi. Bir marta kiritasiz — keyin Telegram hisobingiz tanib olinadi.</i>");
      return new Response("ok");
    }

    // Rolni aniqlash
    const { data: who } = await db.rpc("admin_role_of", { p_user_id: link.user_id });
    const roleRow = Array.isArray(who) ? who[0] : who;
    const role    = roleRow?.role ?? null;
    const email   = roleRow?.email ?? "";

    if (role !== "admin" && role !== "super_admin") {
      await send(chatId, "🔒 Sizning hisobingizda admin huquqi yo'q.");
      return new Response("ok");
    }
    const isSuper = role === "super_admin";
    await db.from("telegram_admins")
      .update({ last_seen_at: new Date().toISOString() }).eq("telegram_id", tid);

    const home = `👋 <b>Avtotestu admin</b>\n\n${esc(ko(email))} · ${esc(role)}\n\nKerakli bo'limni tanlang:`;

    // ── Buyruqlar ────────────────────────────────────────────────────────
    if (text === "/start" || text === "/boshlash" || text === "/menu") {
      await clearState(db, tid);
      await send(chatId, home, mainMenu(isSuper));
      return new Response("ok");
    }
    if (text === "/bekor") {
      await clearState(db, tid);
      await send(chatId, "Bekor qilindi.", mainMenu(isSuper));
      return new Response("ok");
    }

    // ── Tugma bosilishi ──────────────────────────────────────────────────
    if (cb) {
      const d      = cb.data as string;
      const msgId  = cb.message.message_id as number;
      await tg("answerCallbackQuery", { callback_query_id: cb.id });

      if (d === "m:home") {
        await clearState(db, tid);
        await edit(chatId, msgId, home, mainMenu(isSuper));
        return new Response("ok");
      }

      // ── To'lovlar ──────────────────────────────────────────────────────
      if (d === "m:pay") {
        await edit(chatId, msgId, "💳 <b>To'lovlar</b>\n\nNimani ko'rasiz?", [
          [{ text: "📊 Umumiy", callback_data: "p:stats" }],
          [{ text: "📅 Kunlik (7 kun)", callback_data: "p:daily" }],
          [{ text: "🧾 Oxirgi 10 ta", callback_data: "p:recent" }],
          ...BACK,
        ]);
        return new Response("ok");
      }
      if (d === "p:stats") {
        const { data } = await db.rpc("admin_payment_stats");
        const lines = (data ?? []).map((r: any) =>
          `${esc(r.davr)}\n  <b>${som(r.som)}</b> so'm · ${r.tolov} ta · ${r.userlar} user`);
        await edit(chatId, msgId, "📊 <b>To'lov statistikasi</b>\n\n" + lines.join("\n\n"), [
          [{ text: "🔄 Yangilash", callback_data: "p:stats" }], ...BACK,
        ]);
        return new Response("ok");
      }
      if (d === "p:daily") {
        const { data } = await db.rpc("admin_payment_daily", { p_days: 7 });
        const lines = (data ?? []).map((r: any) =>
          `<code>${esc(r.kun)}</code>  ${String(r.tolov).padStart(2)} ta · <b>${som(r.som)}</b>`);
        await edit(chatId, msgId,
          "📅 <b>Oxirgi 7 kun</b>\n\n" + (lines.join("\n") || "Ma'lumot yo'q"), [
          [{ text: "🔄 Yangilash", callback_data: "p:daily" }], ...BACK,
        ]);
        return new Response("ok");
      }
      if (d === "p:recent") {
        const { data } = await db.rpc("admin_payment_recent", { p_limit: 10 });
        const lines = (data ?? []).map((r: any) =>
          `${esc(sana(r.sana))}\n  ${esc(ko(r.email ?? "—"))}\n  ${esc(PLAN[r.tarif] ?? r.tarif)} · <b>${som(r.som)}</b> so'm`);
        await edit(chatId, msgId,
          "🧾 <b>Oxirgi to'lovlar</b>\n\n" + (lines.join("\n\n") || "Ma'lumot yo'q"), [
          [{ text: "🔄 Yangilash", callback_data: "p:recent" }], ...BACK,
        ]);
        return new Response("ok");
      }

      // ── PRO berish ─────────────────────────────────────────────────────
      if (d === "m:pro") {
        await setState(db, tid, "pro:email", {});
        await edit(chatId, msgId,
          "⭐ <b>PRO berish</b>\n\nFoydalanuvchining <b>telefon raqami</b> yoki <b>emailini</b> yuboring.\n\n" +
          "<i>Masalan:</i> <code>901234567</code> yoki <code>user@gmail.com</code>\n\n/bekor — to'xtatish");
        return new Response("ok");
      }
      if (d.startsWith("pro:d:")) {
        const st = await getState(db, tid);
        if (!st) { await send(chatId, "⏱ Vaqt tugadi. /boshlash"); return new Response("ok"); }
        const days = Number(d.split(":")[2]);
        if (days === 0) {
          await setState(db, tid, "pro:days_custom", st.data);
          await edit(chatId, msgId, "Necha kun? Raqam yuboring (1–366).\n\n/bekor");
          return new Response("ok");
        }
        return await askMode(db, chatId, msgId, tid, st.data, days);
      }
      if (d.startsWith("pro:m:")) {
        const st = await getState(db, tid);
        if (!st) { await send(chatId, "⏱ Vaqt tugadi. /boshlash"); return new Response("ok"); }
        const mode = d.split(":")[2];
        return await applyPro(db, chatId, msgId, tid, link.user_id, { ...st.data, mode });
      }

      // ── Parol ──────────────────────────────────────────────────────────
      if (d === "m:pwd") {
        if (!isSuper) {
          await edit(chatId, msgId, "🔒 Parol o'zgartirish faqat <b>super_admin</b> uchun.", BACK);
          return new Response("ok");
        }
        await setState(db, tid, "pwd:email", {});
        await edit(chatId, msgId,
          "🔑 <b>Parol o'zgartirish</b>\n\nFoydalanuvchining <b>telefon raqami</b> yoki <b>emailini</b> yuboring.\n\n/bekor — to'xtatish");
        return new Response("ok");
      }
      if (d === "pwd:auto" || d === "pwd:manual") {
        if (!isSuper) return new Response("ok");
        const st = await getState(db, tid);
        if (!st) { await send(chatId, "⏱ Vaqt tugadi. /boshlash"); return new Response("ok"); }
        if (d === "pwd:manual") {
          await setState(db, tid, "pwd:custom", st.data);
          await edit(chatId, msgId,
            "Yangi parolni yuboring (kamida 8 belgi).\n\n" +
            "⚠️ Xabaringiz <b>avtomatik o'chiriladi</b>.\n\n/bekor");
          return new Response("ok");
        }
        const pwd = genPassword();
        return await applyPwd(db, chatId, msgId, tid, link.user_id, st.data, pwd, false);
      }

      return new Response("ok");
    }

    // ── Matnli javoblar (holatga qarab) ──────────────────────────────────
    const st = await getState(db, tid);
    if (!st || !text) {
      if (text) await send(chatId, "Menyu: /boshlash");
      return new Response("ok");
    }

    // PRO — foydalanuvchini topish
    if (st.step === "pro:email" || st.step === "pwd:email") {
      const em = toEmail(text);
      if (!em) {
        await send(chatId, "❌ Raqam yoki email noto'g'ri. Qayta yuboring yoki /bekor");
        return new Response("ok");
      }
      const { data: u } = await db.rpc("admin_find_by_email", { p_email: em });
      const row = Array.isArray(u) ? u[0] : u;
      if (!row?.user_id) {
        await send(chatId, `❌ <b>${esc(ko(em))}</b> topilmadi.\n\nQayta yuboring yoki /bekor`);
        return new Response("ok");
      }

      const amal = row.tariff_end_date && new Date(row.tariff_end_date) > new Date();
      const info =
        `👤 <b>${esc(ko(row.email))}</b>\n` +
        `Holat: ${amal ? `✅ PRO — ${esc(sana(row.tariff_end_date))} gacha` : "⚪️ PRO yo'q"}\n` +
        `Testlar: ${row.test_soni ?? 0} ta`;

      if (st.step === "pro:email") {
        await setState(db, tid, "pro:days", {
          user_id: row.user_id, email: row.email, tariff_end_date: row.tariff_end_date,
        });
        await send(chatId, info + "\n\n<b>Qancha muddatga PRO berilsin?</b>", [
          [{ text: "7 kun", callback_data: "pro:d:7" },
           { text: "30 kun", callback_data: "pro:d:30" }],
          [{ text: "90 kun", callback_data: "pro:d:90" },
           { text: "Boshqa", callback_data: "pro:d:0" }],
          ...BACK,
        ]);
      } else {
        if (!isSuper) return new Response("ok");
        await setState(db, tid, "pwd:choice", { user_id: row.user_id, email: row.email });
        await send(chatId, info + "\n\n<b>Yangi parol qanday bo'lsin?</b>", [
          [{ text: "🎲 Avtomatik", callback_data: "pwd:auto" }],
          [{ text: "✍️ O'zim yozaman", callback_data: "pwd:manual" }],
          ...BACK,
        ]);
      }
      return new Response("ok");
    }

    // PRO — qo'lda kiritilgan kun soni
    if (st.step === "pro:days_custom") {
      const days = Number(text);
      if (!Number.isInteger(days) || days < 1 || days > 366) {
        await send(chatId, "❌ 1 dan 366 gacha butun son yuboring.");
        return new Response("ok");
      }
      const m = await send(chatId, "⏳");
      return await askMode(db, chatId, m?.result?.message_id, tid, st.data, days);
    }

    // Parol — qo'lda kiritilgan
    if (st.step === "pwd:custom") {
      if (!isSuper) return new Response("ok");
      if (text.length < 8) {
        await send(chatId, "❌ Kamida 8 belgi bo'lishi kerak.");
        return new Response("ok");
      }
      // Parol yozilgan xabarni chatdan o'chiramiz
      await tg("deleteMessage", { chat_id: chatId, message_id: msg.message_id });
      const m = await send(chatId, "⏳");
      return await applyPwd(db, chatId, m?.result?.message_id, tid, link.user_id, st.data, text, true);
    }

    return new Response("ok");
  } catch (err) {
    console.error("[bot] kritik xato:", err);
    try { await send(chatId, "⚠️ Xatolik yuz berdi. /boshlash"); } catch { /* ignore */ }
    return new Response("ok");
  }
});

// ── Yordamchi oqimlar ──────────────────────────────────────────────────────

/** Amaldagi obuna bor bo'lsa: qo'shishmi yoki almashtirishmi. */
async function askMode(
  db: SupabaseClient, chatId: number, msgId: number, tid: number,
  data: Record<string, unknown>, days: number,
) {
  const end = data.tariff_end_date as string | null;
  const amal = end && new Date(end) > new Date();
  await setState(db, tid, "pro:mode", { ...data, days });

  if (!amal) {
    // Obuna yo'q — savol bermaymiz, to'g'ridan-to'g'ri qo'llaymiz
    return await applyPro(db, chatId, msgId, tid, null, { ...data, days, mode: "set" });
  }

  const qolgan = Math.ceil((new Date(end!).getTime() - Date.now()) / 86_400_000);
  await edit(chatId, msgId,
    `👤 <b>${esc(ko(String(data.email)))}</b>\n\n` +
    `Amaldagi PRO: <b>${qolgan} kun</b> qolgan (${esc(sana(end))})\n` +
    `Berilayotgan: <b>${days} kun</b>\n\n` +
    `<b>Qanday qo'llansin?</b>`, [
    [{ text: `➕ Ustiga qo'shish (${qolgan + days} kun)`, callback_data: "pro:m:add" }],
    [{ text: `🔄 Almashtirish (${days} kun)`, callback_data: "pro:m:set" }],
    [{ text: "◀️ Bekor", callback_data: "m:home" }],
  ]);
  return new Response("ok");
}

/** PRO ni qo'llash: profiles + subscriptions + audit. */
async function applyPro(
  db: SupabaseClient, chatId: number, msgId: number, tid: number,
  adminId: string | null, data: Record<string, unknown>,
) {
  // adminId berilmagan bo'lsa holatdan tiklaymiz
  if (!adminId) {
    const { data: l } = await db.from("telegram_admins")
      .select("user_id").eq("telegram_id", tid).maybeSingle();
    adminId = l?.user_id ?? null;
  }

  const userId = String(data.user_id);
  const email  = String(data.email);
  const days   = Number(data.days);
  const mode   = (data.mode as string) ?? "set";
  const nowIso = new Date().toISOString();
  const oldEnd = (data.tariff_end_date as string | null) ?? null;

  // "add" — mavjud tugash sanasidan boshlab sanaymiz
  const boshlanish =
    mode === "add" && oldEnd && new Date(oldEnd) > new Date() ? oldEnd : nowIso;
  const endDate = tariffEnd(boshlanish, days);

  const { error: pErr } = await db.from("profiles")
    .update({ tariff_days: days, tariff_end_date: endDate }).eq("id", userId);
  if (pErr) {
    await edit(chatId, msgId, "❌ Xato: " + esc(pErr.message), BACK);
    return new Response("ok");
  }

  await db.from("subscriptions").insert({
    user_id: userId, plan_name: "basic", status: "active",
    started_at: nowIso, expires_at: endDate, tariff_days: days,
    is_trial: false, assigned_by: adminId,
    note: `Telegram bot orqali (${mode === "add" ? "qo'shildi" : "almashtirildi"})`,
  });

  await audit(db, adminId!, "pro_grant", {
    target_user: userId, email, days, mode,
    old_end: oldEnd, new_end: endDate, via: "telegram_bot",
  });
  await clearState(db, tid);

  await edit(chatId, msgId,
    `✅ <b>PRO berildi</b>\n\n` +
    `👤 ${esc(ko(email))}\n` +
    `📅 ${days} kun (${mode === "add" ? "ustiga qo'shildi" : "almashtirildi"})\n` +
    `⏰ Tugaydi: <b>${esc(sana(endDate))}</b>`, BACK);
  return new Response("ok");
}

/** Parolni o'zgartirish. Parol MATNI logga yozilmaydi. */
async function applyPwd(
  db: SupabaseClient, chatId: number, msgId: number, tid: number,
  adminId: string, data: Record<string, unknown>, password: string, manual: boolean,
) {
  const userId = String(data.user_id);
  const email  = String(data.email);

  const { error } = await db.auth.admin.updateUserById(userId, { password });
  if (error) {
    await edit(chatId, msgId, "❌ Xato: " + esc(error.message), BACK);
    return new Response("ok");
  }

  // DIQQAT: `password` maydoni ataylab YO'Q.
  await audit(db, adminId, "password_reset", {
    target_user: userId, email, manual, via: "telegram_bot",
  });
  await clearState(db, tid);

  await edit(chatId, msgId,
    `✅ <b>Parol o'zgartirildi</b>\n\n` +
    `👤 ${esc(ko(email))}\n` +
    `🔑 Yangi parol: <code>${esc(password)}</code>\n\n` +
    `<i>Foydalanuvchiga yuboring va bu xabarni o'chiring.</i>`, BACK);
  return new Response("ok");
}

/** O'qishga qulay, chalkashtiradigan belgilarsiz parol. */
function genPassword(): string {
  const abc = "abcdefghijkmnpqrstuvwxyz";   // l, o yo'q
  const num = "23456789";                    // 0, 1 yo'q
  const pick = (s: string, n: number) =>
    Array.from(crypto.getRandomValues(new Uint32Array(n)))
      .map((v) => s[v % s.length]).join("");
  return pick(abc, 6) + pick(num, 3);
}
