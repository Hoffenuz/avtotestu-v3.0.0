/**
 * Turnstile tokenini SERVERDA tekshirish.
 *
 * Token faqat Cloudflare va bizning server o'rtasidagi maxfiy kalit bilan
 * tasdiqlanadi, shuning uchun tekshiruv har doim `verify-turnstile` Edge
 * Function orqali o'tadi — brauzerdagi hech qanday qiymatga ishonilmaydi.
 */
import { supabase } from '@/integrations/supabase/client';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

/**
 * Site key sozlanganmi. Sozlanmagan bo'lsa forma bloklanmaydi — bu lokal
 * ishlab chiqishda qulay, productionda esa kalit albatta qo'yiladi.
 */
export function isTurnstileConfigured(): boolean {
  return typeof SITE_KEY === 'string' && SITE_KEY.trim().length > 0;
}

/** Widget uchun site key (Turnstile komponenti ishlatadi). */
export function getTurnstileSiteKey(): string | undefined {
  return SITE_KEY?.trim() || undefined;
}

export interface TurnstileVerifyResult {
  ok: boolean;
  /** Foydalanuvchiga ko'rsatiladigan xabar (ok=false bo'lganda). */
  message?: string;
}

export async function verifyTurnstileToken(
  token: string,
  options: { action?: string; emailAttempt?: string } = {},
): Promise<TurnstileVerifyResult> {
  if (!token?.trim()) {
    return { ok: false, message: "Iltimos, \"men robot emasman\" tekshiruvidan o'ting." };
  }

  try {
    const { data, error } = await supabase.functions.invoke<{
      success?: boolean;
      error?: string;
    }>('verify-turnstile', {
      body: {
        token,
        action: options.action ?? 'signup',
        email_attempt: options.emailAttempt,
      },
    });

    if (error) {
      // Edge Function 4xx/5xx qaytarsa tafsilot `context` ichida keladi
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        try {
          const parsed = (await ctx.json()) as { error?: string };
          if (parsed?.error) return { ok: false, message: parsed.error };
        } catch {
          /* ignore */
        }
      }
      return { ok: false, message: "Tekshiruvni yakunlab bo'lmadi. Qayta urinib ko'ring." };
    }

    if (data?.success) return { ok: true };
    return { ok: false, message: data?.error ?? "Tekshiruv o'tmadi. Qayta urinib ko'ring." };
  } catch {
    return { ok: false, message: "Tarmoq xatosi. Internetni tekshirib, qayta urinib ko'ring." };
  }
}
