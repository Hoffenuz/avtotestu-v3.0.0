/**
 * Ro'yxatdan o'tishga yuborilgan foydalanuvchining tanlagan PRO tarifi.
 *
 * Muammo: mehmon "15 000 so'm" tugmasini bosadi, uni ro'yxatdan o'tishga
 * yuboramiz — va o'tgach u qayerga bosganini tizim unutadi. Foydalanuvchi
 * qaytadan PRO bo'limini topib, tarifni qaytadan tanlashi kerak bo'lardi.
 *
 * Nega sessionStorage: Google orqali kirish to'liq sahifa yangilanishi bilan
 * qaytadi, shuning uchun React state ham, `navigate` state ham yo'qoladi.
 * localStorage esa ortiqcha — tanlov keyingi kunga qolmasligi kerak.
 */
const KEY = 'pending_pro_plan';

/** Yarim soatdan keyin tanlov eskirgan hisoblanadi. */
const MAX_AGE_MS = 30 * 60 * 1000;

/** To'lov tizimi. Standart — Payme. */
export type PaymentProvider = 'payme' | 'click';

interface Stored {
  plan: string;
  at: number;
  /** Eski yozuvlarda bo'lmaydi — ular Payme deb o'qiladi. */
  provider?: PaymentProvider;
}

export function setPendingPlan(planName: string, provider: PaymentProvider = 'payme'): void {
  try {
    const value: Stored = { plan: planName, at: Date.now(), provider };
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Private rejim yoki storage to'la — bu shunchaki qulaylik, to'lovning
    // o'zi bunga bog'liq emas.
  }
}

/**
 * Saqlangan tarifni qaytaradi, lekin o'chirmaydi.
 *
 * O'chirish alohida: tarif nomi haqiqiy ekani va to'lov havolasi yasalgani
 * tasdiqlangandan keyingina tozalaymiz, aks holda bitta nosozlikda
 * foydalanuvchining tanlovi bekorga yo'qoladi.
 */
export function peekPendingPlan(): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<Stored>;
    if (typeof parsed?.plan !== 'string' || !parsed.plan) {
      clearPendingPlan();
      return null;
    }
    if (typeof parsed.at !== 'number' || Date.now() - parsed.at > MAX_AGE_MS) {
      clearPendingPlan();
      return null;
    }
    return parsed.plan;
  } catch {
    clearPendingPlan();
    return null;
  }
}

/**
 * Saqlangan tanlovdagi to'lov tizimi. Faqat `peekPendingPlan()` tarif
 * qaytargandan keyin ma'noga ega; noma'lum qiymat Payme deb olinadi.
 */
export function peekPendingProvider(): PaymentProvider {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return 'payme';
    const parsed = JSON.parse(raw) as Partial<Stored>;
    return parsed?.provider === 'click' ? 'click' : 'payme';
  } catch {
    return 'payme';
  }
}

export function clearPendingPlan(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // e'tiborsiz
  }
}
