/**
 * TelegramLoginButton — rasmiy Telegram Login Widget.
 *
 * Turnstile'dan FARQI: Telegram vidjeti imperativ API (`window.turnstile.render()`)
 * bermaydi — u DEKLARATIV: sahifaga aynan shu data-atributli `<script>` tegi
 * qo'yilsa, Telegram'ning o'zi uni o'qib, o'rniga tugma (iframe) chizadi.
 * Shuning uchun bu yerda React elementi emas, xom DOM script elementi
 * qo'lda yaratiladi va konteynerga qo'shiladi.
 *
 * Oqim:
 *  1. Foydalanuvchi tugmani bosadi, Telegram popup'da tasdiqlaydi.
 *  2. Telegram global `window.onTelegramAuth(user)` funksiyasini chaqiradi
 *     (imzolangan ma'lumot bilan: id, first_name, auth_date, hash, ...).
 *  3. Shu ma'lumot `telegram-login` Edge Function'ga yuboriladi — u yerda
 *     imzo tekshiriladi va bir martalik OTP qaytariladi.
 *  4. `supabase.auth.verifyOtp()` bilan OTP haqiqiy sessiyaga almashtiriladi.
 *     Parol HECH QAYERDA ishlatilmaydi.
 */
import { useEffect, useId, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTelegramLoginBotUsername, isTelegramLoginConfigured } from "@/lib/telegramLogin";

const SCRIPT_SRC = "https://telegram.org/js/telegram-widget.js?22";

/** Telegram'dan keladigan xom obyekt. */
interface TelegramAuthUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    // Kalit nomi Telegram tomonidan belgilanadi (widget shu nomni chaqiradi)
    // va bir nechta widget nusxasi orasida ziddiyat bo'lmasligi uchun
    // funksiya nomi component ID'siga bog'langan (pastga qarang).
    [key: `onTelegramAuth_${string}`]: ((user: TelegramAuthUser) => void) | undefined;
  }
}

interface Props {
  /** Muvaffaqiyatli kirishdan KEYIN chaqiriladi (masalan sahifaga o'tish uchun). */
  onSuccess: () => void;
  /** Xato bo'lsa xabar matni bilan chaqiriladi. */
  onError: (message: string) => void;
  className?: string;
}

export function TelegramLoginButton({ onSuccess, onError, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [loading, setLoading] = useState(false);
  // Har bir komponent nusxasi o'z global callback nomiga ega bo'lsin —
  // bir nechta joyda ishlatilsa ham bir-birini bosib qolmaydi.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const callbackName = `onTelegramAuth_${uid}` as const;

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    if (!isTelegramLoginConfigured()) return;

    /**
     * Telegram user obyektini qabul qilib, serverga yuboradi va sessiyaga
     * almashtiradi. `async` — Telegram widget callback'ni kutmaydi, shuning
     * uchun ichki xatolar shu yerning o'zida ushlanadi.
     */
    window[callbackName] = (user: TelegramAuthUser) => {
      void (async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke<{
            ok?: boolean;
            email?: string;
            otp?: string;
            error?: string;
          }>("telegram-login", { body: user });

          let result = data;
          if (error) {
            const ctx = (error as { context?: Response }).context;
            if (ctx && typeof ctx.json === "function") {
              try { result = await ctx.json(); } catch { /* ignore */ }
            }
          }

          if (!result?.ok || !result.email || !result.otp) {
            onErrorRef.current("Telegram orqali kirishda xatolik. Qayta urinib ko'ring.");
            return;
          }

          const { error: otpErr } = await supabase.auth.verifyOtp({
            email: result.email,
            token: result.otp,
            type: "email",
          });

          if (otpErr) {
            onErrorRef.current("Sessiya ochilmadi. Qayta urinib ko'ring.");
            return;
          }

          onSuccessRef.current();
        } catch {
          onErrorRef.current("Internet aloqasi uzildi. Qayta urinib ko'ring.");
        } finally {
          setLoading(false);
        }
      })();
    };

    const container = containerRef.current;
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.setAttribute("data-telegram-login", getTelegramLoginBotUsername());
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-onauth", `${callbackName}(user)`);
    script.setAttribute("data-request-access", "write");
    container?.appendChild(script);

    return () => {
      // `replaceChildren()` argumentsiz — xavfsiz tozalash, `innerHTML`
      // orqali emas (bo'sh qiymat bo'lsa ham, statik tekshiruvchilar
      // `innerHTML` yozuvini har doim shubhali deb belgilaydi).
      container?.replaceChildren();
      delete window[callbackName];
    };
    // `callbackName` (useId dan) barqaror — widget shu sabab qayta chizilmaydi.
  }, [callbackName]);

  if (!isTelegramLoginConfigured()) return null;

  return (
    <div className={className}>
      <div ref={containerRef} className="flex justify-center min-h-[40px]" />
      {loading && (
        <p className="mt-2 text-center text-xs text-muted-foreground">Kirilmoqda...</p>
      )}
    </div>
  );
}

export default TelegramLoginButton;
