/**
 * Telegram Login Widget — mijoz tomonidagi sozlama.
 *
 * Bot foydalanuvchi nomi MAXFIY EMAS (widget'ning o'zida ham ochiq
 * ko'rinadi), shuning uchun oddiy `VITE_` o'zgaruvchisi sifatida saqlanadi.
 * Haqiqiy himoya — bot TOKENI — Supabase Vault'da
 * (`get_telegram_login_bot_token()` RPC), bu yerda emas.
 */
const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_LOGIN_BOT as string | undefined;

/**
 * Sozlanganmi. Sozlanmagan bo'lsa tugma UMUMAN ko'rsatilmaydi — bu lokal
 * ishlab chiqishda yoki bot hali @BotFather'da domen bilan bog'lanmagan
 * paytda qulay: yarim ishlaydigan tugma ko'rsatilmaydi.
 */
export function isTelegramLoginConfigured(): boolean {
  return typeof BOT_USERNAME === "string" && BOT_USERNAME.trim().length > 0;
}

/** `@` belgisisiz bot foydalanuvchi nomi (masalan "Avtotestubot"). */
export function getTelegramLoginBotUsername(): string {
  return (BOT_USERNAME ?? "").trim().replace(/^@/, "");
}
