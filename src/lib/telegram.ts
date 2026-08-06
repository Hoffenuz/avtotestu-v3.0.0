/** Rasmiy Telegram manzillari — bitta joyda saqlanadi. */

/** Foydalanuvchilar guruhi: savol-javob va yordam. */
export const TELEGRAM_GROUP_URL = 'https://t.me/Avtotest_laruz';

/** Administrator (shaxsiy murojaat, parolni tiklash va h.k.). */
export const TELEGRAM_ADMIN_URL = 'https://t.me/avtotestu_ad';

/**
 * PRO taklifi bir marta ko'rsatilishi uchun localStorage kaliti.
 * Har foydalanuvchi uchun alohida — bir qurilmada bir necha hisob
 * ishlatilsa ham taklif har biriga bir martadan chiqadi.
 */
export function proGroupInviteKey(userId: string): string {
  return `tg_group_invite_seen_${userId}`;
}
