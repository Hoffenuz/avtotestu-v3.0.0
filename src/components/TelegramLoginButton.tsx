/**
 * TelegramLoginButton — Telegram orqali PAROLSIZ kirish, DEEP-LINK asosida.
 *
 * NEGA RASMIY WIDGET (iframe) ISHLATILMAYDI: Telegram Login Widget
 * `oauth.telegram.org` ni iframe sifatida chizadi. Bu KENG TANILGAN muammo
 * (Telegram'ning o'z ekotizimida hujjatlashtirilgan) — Safari uchinchi tomon
 * cookie'larini STANDART holatda bloklaydi (ITP), Chrome/Firefox maxfiylik
 * rejimlari ham xuddi shunday. Natijada iframe HECH QACHON chizilmaydi va
 * hech qanday xato ham chiqmaydi — kodda TUZATIB BO'LMAYDIGAN muammo,
 * chunki brauzerning o'zi bloklaydi.
 *
 * Shuning uchun iframe/cookie MUTLAQO ishlatilmaydi. O'rniga:
 *  1. "Telegram orqali kirish" tugmasi bosiladi — bu ODDIY React tugmasi,
 *     dizaynini to'liq nazorat qilamiz (widget bilan FARQI shu).
 *  2. Bir martalik token so'raladi, foydalanuvchi `t.me/<bot>?start=login_
 *     <token>` havolasiga o'tadi (oddiy navigatsiya — iframe yo'q, cookie
 *     yo'q, hech qachon buzilmaydi; mobil qurilmada to'g'ridan-to'g'ri
 *     Telegram ilovasini ochadi).
 *  3. Telegram'da /start bosiladi, VPS'dagi bot buni tasdiqlaydi.
 *  4. Bu sahifa token holatini so'raydi (polling). Tasdiqlangach OTP
 *     qaytadi, `supabase.auth.verifyOtp()` bilan sessiyaga almashtiriladi.
 */
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getTelegramLoginBotUsername, isTelegramLoginConfigured } from "@/lib/telegramLogin";
import { isMobileDevice } from "@/lib/desktopApp";

/** Token qancha vaqt tasdiqlanishini kutamiz — undan keyin "vaqt tugadi". */
const POLL_TIMEOUT_MS = 3 * 60 * 1000;
const POLL_INTERVAL_MS = 2000;

interface Props {
  /**
   * "login" — kirish/ro'yxatdan o'tish (sessiya ochiladi).
   * "link"  — allaqachon kirgan foydalanuvchi hisobiga biriktirish.
   */
  mode?: "login" | "link";
  /** Muvaffaqiyatdan KEYIN chaqiriladi. `link` rejimida @username uzatiladi. */
  onSuccess: (telegramUsername?: string | null) => void;
  /** Xato bo'lsa xabar matni bilan chaqiriladi. */
  onError: (message: string) => void;
  className?: string;
}

type Phase = "idle" | "waiting" | "timeout";

/**
 * Mijoz maxfiy qiymati — tokenni AYNAN SHU brauzerga bog'laydi.
 *
 * Nega kerak: busiz hujumchi o'zi tasdiqlagan tokenni birovning brauzeriga
 * "sovg'a qilib", uni o'z hisobiga kiritib qo'yishi mumkin edi (OWASP:
 * login CSRF / "session donation"). Server faqat SHA-256 ini biladi, shuning
 * uchun hatto baza sizib chiqsa ham bu qiymat tiklanmaydi.
 */
function createClientSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Server xato kodlarini foydalanuvchi tilidagi xabarga aylantiradi. */
function messageForError(code: string | undefined, mode: "login" | "link"): string {
  switch (code) {
    case "telegram_already_linked":
      return "Bu Telegram hisobi boshqa profilga bog'langan.";
    case "not_authenticated":
      return "Sessiya tugagan. Sahifani yangilab, qayta urinib ko'ring.";
    case "not_configured":
      return "Telegram orqali kirish hozircha sozlanmagan.";
    case "expired":
      return "Havola muddati tugadi. Qayta urinib ko'ring.";
    default:
      return mode === "link"
        ? "Telegramni bog'lashda xatolik. Qayta urinib ko'ring."
        : "Telegram orqali kirishda xatolik. Qayta urinib ko'ring.";
  }
}

/**
 * Telegram nishoni — kirish paneli va profil bo'limida bir xil ko'rinsin
 * uchun shu yerda bir marta yoziladi (lucide'da Telegram logotipi yo'q).
 */
export function TelegramLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 240 240" fill="none" aria-hidden="true">
      <circle cx="120" cy="120" r="120" fill="#2AABEE" />
      <path
        fill="#fff"
        d="M55 118l125-48c6-2 11 1 9 10l-21 100c-2 8-7 10-14 6l-38-28-18 17c-2 2-4 4-8 4l3-40 73-66c3-3-1-5-5-2l-90 57-39-12c-8-3-8-9 2-12z"
      />
    </svg>
  );
}

export function TelegramLoginButton({
  mode = "login",
  onSuccess,
  onError,
  className,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  // Telegram'dagi xabar bilan solishtirish uchun ekranda ko'rsatiladigan kod.
  const [code, setCode] = useState<string | null>(null);
  const stopRef = useRef(false);

  // Komponent yo'q qilinsa (masalan foydalanuvchi sahifadan chiqib ketsa)
  // polling darhol to'xtasin.
  useEffect(() => () => {
    stopRef.current = true;
  }, []);

  if (!isTelegramLoginConfigured()) return null;

  const pollUntilDone = async (token: string, clientSecret: string, deadline: number) => {
    while (!stopRef.current) {
      if (Date.now() > deadline) {
        if (!stopRef.current) setPhase("timeout");
        return;
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      if (stopRef.current) return;

      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        status?: "pending" | "done";
        email?: string;
        otp?: string;
        telegram_username?: string | null;
        error?: string;
      }>("telegram-login?action=poll", { body: { token, client_secret: clientSecret } });

      if (stopRef.current) return;

      let result = data;
      if (error) {
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            result = await ctx.json();
          } catch {
            /* pastdagi umumiy xabar ishlatiladi */
          }
        }
      }

      if (!result?.ok) {
        setPhase("idle");
        setCode(null);
        onError(messageForError(result?.error, mode));
        return;
      }
      if (result.status === "pending") continue;

      // status === "done"
      setCode(null);
      if (mode === "link") {
        setPhase("idle");
        onSuccess(result.telegram_username ?? null);
        return;
      }

      if (!result.email || !result.otp) {
        setPhase("idle");
        onError(messageForError(undefined, mode));
        return;
      }

      const { error: otpErr } = await supabase.auth.verifyOtp({
        email: result.email,
        token: result.otp,
        type: "email",
      });
      setPhase("idle");
      if (otpErr) {
        onError("Sessiya ochilmadi. Qayta urinib ko'ring.");
        return;
      }
      onSuccess(null);
      return;
    }
  };

  const handleClick = async () => {
    // Yangi oyna DARHOL, sinxron ochiladi — token so'rovi tugaguncha
    // kutilsa, brauzer buni "popup" deb bloklashi mumkin (foydalanuvchi
    // bosishi bilan bevosita bog'liq bo'lmagan `window.open` chaqiruvlari
    // ko'plab brauzerlarda avtomatik bloklanadi).
    const isMobile = isMobileDevice();
    const popup = isMobile ? null : window.open("", "_blank");

    setPhase("waiting");
    setCode(null);
    stopRef.current = false;

    const clientSecret = createClientSecret();
    const clientHash = await sha256Hex(clientSecret);

    const { data, error } = await supabase.functions.invoke<{
      ok?: boolean;
      token?: string;
      code?: string;
      error?: string;
    }>("telegram-login?action=start", { body: { mode, client_hash: clientHash } });

    if (stopRef.current) return;

    if (error || !data?.ok || !data.token) {
      popup?.close();
      setPhase("idle");
      onError(messageForError(data?.error, mode));
      return;
    }

    setCode(data.code ?? null);

    const deepLink = `https://t.me/${getTelegramLoginBotUsername()}?start=login_${data.token}`;
    if (isMobile) {
      window.location.href = deepLink;
    } else if (popup) {
      popup.location.href = deepLink;
    } else {
      // Popup ham bloklangan — to'liq sahifa navigatsiyasi hamma vaqt ishlaydi.
      window.location.href = deepLink;
    }

    await pollUntilDone(data.token, clientSecret, Date.now() + POLL_TIMEOUT_MS);
  };

  const handleCancel = () => {
    stopRef.current = true;
    setPhase("idle");
    setCode(null);
  };

  if (phase === "waiting") {
    return (
      <div className={className}>
        <div className="rounded-xl border border-[#2AABEE]/30 bg-[#2AABEE]/[0.08] px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#2AABEE]" />
              Telegram'da tasdiqlang
            </span>
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Bekor qilish"
              className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/*
            Tasdiqlash kodi — foydalanuvchi buni Telegram'dagi xabardagi kod
            bilan SOLISHTIRADI. Bu soxta havoladan himoya qiladi: begona
            so'rovda kod mos kelmaydi va foydalanuvchi bekor qiladi.
          */}
          {code && (
            <div className="mt-3 border-t border-[#2AABEE]/20 pt-3 text-center">
              <p className="text-[11px] text-muted-foreground">
                Telegram'da shu kod ko'rsatilishi kerak:
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-foreground">
                {code}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Kod boshqacha bo'lsa — tasdiqlamang.
              </p>
            </div>
          )}
        </div>
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
          Telegram ochilmadimi?{" "}
          <button
            type="button"
            onClick={() => void handleClick()}
            className="font-medium underline underline-offset-2"
          >
            Qayta urinish
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void handleClick()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2AABEE] px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm shadow-[#2AABEE]/25 transition-colors hover:bg-[#229ED9]"
      >
        <TelegramLogo className="h-[18px] w-[18px]" />
        {mode === "link" ? "Telegramni bog'lash" : "Telegram orqali kirish"}
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </button>
      {phase === "timeout" && (
        <p className="mt-2 text-center text-xs text-destructive">
          Vaqt tugadi — tasdiqlanmadi. Yuqoridagi tugmani qayta bosing.
        </p>
      )}
    </div>
  );
}

export default TelegramLoginButton;
