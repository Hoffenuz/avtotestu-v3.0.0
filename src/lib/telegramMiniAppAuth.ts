/**
 * Telegram Mini App (bot ichidagi sayt) uchun AVTOMATIK kirish.
 *
 * MUAMMO: bot "Saytni ochish" tugmasi saytni Telegram'ning O'Z WebView'ida
 * ochadi. Uning saqlash joyi (localStorage) brauzernikidan butunlay
 * ajratilgan — hatto Telegram Web'da ham sahifa uchinchi tomon iframe'i
 * bo'lgani uchun brauzer saqlashni bo'lib qo'yadi. Ya'ni foydalanuvchi
 * Chrome'da saytga kirgan bo'lsa ham, bot ichidagi oynada MEHMON bo'lib
 * qolardi. Odatdagi deep-link oqimi esa bu yerda ishlamaydi: u Telegram'ni
 * ochishni talab qiladi, biz esa allaqachon Telegram ichidamiz.
 *
 * YECHIM: Telegram Mini App'ga `initData` beradi — bot tokeni bilan
 * imzolangan foydalanuvchi ma'lumoti. Server imzoni tekshiradi va bir
 * martalik OTP qaytaradi; u sessiyaga almashtiriladi. Foydalanuvchi hech
 * narsa bosmaydi.
 *
 * Telegram'dan tashqarida bu modul HECH NARSA qilmaydi — birinchi
 * tekshiruvda darhol qaytadi, tarmoqqa so'rov ketmaydi.
 */
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/withTimeout';
import { isTelegramWebApp } from './telegramWebApp';

/**
 * Sekin tarmoqda ishga tushishni shundan ortiq ushlab turmaymiz.
 *
 * Chaqiruvchi (AuthContext) buni KUTADI, chunki aks holda foydalanuvchi
 * avval "mehmon" ko'rinishini, keyin esa to'satdan o'zgargan sahifani
 * ko'rardi. Shuning uchun chegara ataylab qisqa: kirish ulgurmasa, sayt
 * mehmon rejimida ochilaveradi va foydalanuvchi qo'lda kira oladi.
 */
const MINI_APP_LOGIN_TIMEOUT_MS = 4_000;

type WebAppResponse = {
  ok?: boolean;
  email?: string;
  otp?: string;
  error?: string;
};

/**
 * `initData` ni o'qiydi.
 *
 * Ikki manba bor va ikkalasi ham kerak:
 *   1. `Telegram.WebApp.initData` — SDK YUKLANGANDAN KEYIN paydo bo'ladi.
 *      Ishga tushish paytida u hali bo'lmasligi mumkin.
 *   2. `window.__tgInitData` — `index.html` dagi erta blok URL fragmentidan
 *      o'qib qo'yadi. URL hali butun bo'lgan yagona ishonchli paytda
 *      olingani uchun React Router fragmentni yo'qotsa ham saqlanib qoladi.
 */
function readInitData(): string {
  if (typeof window === 'undefined') return '';
  try {
    const fromSdk = window.Telegram?.WebApp?.initData;
    if (typeof fromSdk === 'string' && fromSdk.length > 0) return fromSdk;
    const early = window.__tgInitData;
    if (typeof early === 'string' && early.length > 0) return early;
  } catch {
    /* ignore */
  }
  return '';
}

/**
 * Mini App ichida bo'lsa sessiya ochadi.
 *
 * `true` — sessiya ochildi (`onAuthStateChange` SIGNED_IN bilan qolganini
 * o'zi bajaradi). Boshqa barcha holatda `false` va sayt mehmon rejimida
 * davom etadi — bu yerda HECH QACHON xato tashlanmaydi, chunki kirish
 * ulgurmasligi saytning ishlashiga to'sqinlik qilmasligi kerak.
 */
export async function signInWithTelegramMiniApp(): Promise<boolean> {
  if (!isTelegramWebApp()) return false;

  const initData = readInitData();
  if (!initData) return false;

  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke<WebAppResponse>('telegram-login?action=webapp', {
        body: { init_data: initData },
      }),
      MINI_APP_LOGIN_TIMEOUT_MS,
    );

    if (error || !data?.ok || !data.email || !data.otp) return false;

    const { error: otpErr } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.otp,
      type: 'email',
    });
    return !otpErr;
  } catch {
    // Timeout yoki tarmoq xatosi — jimgina mehmon rejimida qolamiz.
    return false;
  }
}
