/** Rasmiy Telegram manzillari — bitta joyda saqlanadi. */

/** Foydalanuvchilar guruhi: savol-javob va yordam. */
export const TELEGRAM_GROUP_URL = 'https://t.me/Avtotest_laruz';

/** Administrator (shaxsiy murojaat, parolni tiklash va h.k.). */
export const TELEGRAM_ADMIN_URL = 'https://t.me/avtotestu_ad';

/**
 * Guruh xabarnomasi bir marta ko'rsatilishi uchun localStorage kaliti.
 *
 * Mehmon uchun umumiy kalit: hisobsiz odam ham xabarnomani har sahifada
 * qayta ko'rmasligi kerak. Kirgach yangi kalit hosil bo'ladi va u bir
 * marta ko'radi — bu ataylab, chunki guruh asosan ro'yxatdan o'tganlarga
 * kerak.
 */
export function groupNoticeKey(userId?: string | null): string {
  return userId ? `tg_group_notice_${userId}` : 'tg_group_notice_guest';
}

/**
 * Qurilma darajasidagi yordamchi belgi: "bu brauzerda kimdir yopgan".
 *
 * NEGA KERAK: haqiqiy kalit foydalanuvchi ID siga bog'langan, ID esa
 * birinchi renderda hali ma'lum emas (sessiya asinxron tiklanadi). Shu
 * sababli xabarnoma mount dan KEYIN qo'shilib, footer ni pastga surardi
 * — qisqa sahifalarda o'lchangan CLS 0.0227 edi.
 *
 * Bu kalit sinxron o'qiladi va birinchi bo'yoqdayoq javob beradi, ya'ni
 * qaytib kelgan odam uchun siljish umuman bo'lmaydi. Haqiqiy hisob esa
 * baribir ID li kalit bo'yicha aniqlanadi.
 */
export const GROUP_NOTICE_DEVICE_KEY = 'tg_group_notice_device';
