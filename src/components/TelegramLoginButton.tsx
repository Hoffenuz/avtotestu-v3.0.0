/**
 * TelegramLoginButton — rasmiy Telegram Login Widget.
 *
 * Turnstile'dan FARQI: Telegram vidjeti imperativ API (`window.turnstile.render()`)
 * bermaydi — u DEKLARATIV: sahifaga aynan shu data-atributli `<script>` tegi
 * qo'yilsa, Telegram'ning o'zi uni o'qib, o'rniga tugma (iframe) chizadi.
 * Shuning uchun bu yerda React elementi emas, xom DOM script elementi
 * qo'lda yaratiladi va konteynerga qo'shiladi.
 *
 * Tugmaning KO'RINISHINI o'zgartirib bo'lmaydi — u Telegram domenidagi
 * iframe (Google/Apple tugmalari kabi qat'iy). Dizayn shuning uchun uni
 * O'RAB turgan panel orqali beriladi.
 *
 * Oqim:
 *  1. Foydalanuvchi tugmani bosadi, Telegram popup'da tasdiqlaydi.
 *  2. Telegram global callback'ni chaqiradi (imzolangan ma'lumot bilan).
 *  3. Ma'lumot `telegram-login` Edge Function'ga `auth` maydonida yuboriladi
 *     (imzo aynan Telegram maydonlari ustidan hisoblangani uchun ular
 *     xizmat maydonlari bilan ARALASHTIRILMAYDI).
 *  4. "login" rejimida OTP qaytadi va `verifyOtp()` sessiyaga almashtiradi;
 *     "link" rejimida esa hisobga biriktirilgani tasdiqlanadi.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getTelegramLoginBotUsername, isTelegramLoginConfigured } from "@/lib/telegramLogin";

const SCRIPT_SRC = "https://telegram.org/js/telegram-widget.js?22";

/** Telegram tugmasining o'lchami — skelet ham aynan shuncha joy egallaydi. */
const WIDGET_HEIGHT_PX = 40;

/**
 * Skript `onload` chaqirilgandan keyin tugma (iframe) shuncha vaqt ichida
 * PAYDO BO'LMASA, "failed" holatiga o'tamiz.
 *
 * NEGA KERAK: ko'plab reklama-bloklovchilar (uBlock, Brave Shields va h.k.)
 * `telegram-widget.js` so'rovini tarmoq xatosi bilan emas, BO'SH 200 javob
 * bilan bloklaydi — bu holda `onerror` HECH QACHON chaqirilmaydi, `onload`
 * esa "muvaffaqiyatli" ishlaydi, lekin iframe hech qachon paydo bo'lmaydi.
 * Natijada foydalanuvchi xato xabarisiz, faqat bo'sh joy ko'radi — aynan
 * shu sabab "tugma bosilmayapti" deb tushunilgan.
 */
const RENDER_TIMEOUT_MS = 4000;

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

/** Server xato kodlarini foydalanuvchi tilidagi xabarga aylantiradi. */
function messageForError(code: string | undefined, mode: "login" | "link"): string {
  switch (code) {
    case "telegram_already_linked":
      return "Bu Telegram hisobi boshqa profilga bog'langan.";
    case "not_authenticated":
      return "Sessiya tugagan. Sahifani yangilab, qayta urinib ko'ring.";
    case "not_configured":
      return "Telegram orqali kirish hozircha sozlanmagan.";
    case "invalid_signature":
    case "auth_expired":
      return "Telegram tasdig'i eskirgan. Qayta urinib ko'ring.";
    default:
      return mode === "link"
        ? "Telegramni bog'lashda xatolik. Qayta urinib ko'ring."
        : "Telegram orqali kirishda xatolik. Qayta urinib ko'ring.";
  }
}

export function TelegramLoginButton({
  mode = "login",
  onSuccess,
  onError,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const modeRef = useRef(mode);
  const [busy, setBusy] = useState(false);
  /**
   * Vidjet holati. `failed` MUHIM: avval skript yuklanmasa (CSP bloklasa
   * yoki tarmoq uzilsa) sarlavha ostida JIM bo'sh joy qolardi — foydalanuvchi
   * bosadigan narsa yo'qligini tushunmasdi. Endi aniq xabar chiqadi.
   */
  const [widgetState, setWidgetState] = useState<"loading" | "ready" | "failed">("loading");
  // O'zgarganda widget qaytadan yaratiladi — "Qayta urinish" tugmasi shuni ishlatadi.
  const [retryToken, setRetryToken] = useState(0);

  // Har bir komponent nusxasi o'z global callback nomiga ega bo'lsin —
  // bir nechta joyda ishlatilsa ham bir-birini bosib qolmaydi.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const callbackName = `onTelegramAuth_${uid}` as const;

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    modeRef.current = mode;
  }, [onSuccess, onError, mode]);

  const handleAuth = useCallback(
    async (user: TelegramAuthUser) => {
      const currentMode = modeRef.current;
      setBusy(true);
      try {
        const { data, error } = await supabase.functions.invoke<{
          ok?: boolean;
          email?: string;
          otp?: string;
          linked?: boolean;
          telegram_username?: string | null;
          error?: string;
        }>("telegram-login", { body: { mode: currentMode, auth: user } });

        let result = data;
        if (error) {
          // Edge Function xato statusi qaytarsa, tafsilot `context` ichida
          // keladi — aks holda sabab yo'qoladi va hamma xato "noma'lum" bo'ladi.
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            try {
              result = await ctx.json();
            } catch {
              /* javob JSON emas — pastdagi umumiy xabar ishlatiladi */
            }
          }
        }

        if (!result?.ok) {
          onErrorRef.current(messageForError(result?.error, currentMode));
          return;
        }

        if (currentMode === "link") {
          onSuccessRef.current(result.telegram_username ?? user.username ?? null);
          return;
        }

        if (!result.email || !result.otp) {
          onErrorRef.current(messageForError(undefined, currentMode));
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

        onSuccessRef.current(user.username ?? null);
      } catch {
        onErrorRef.current("Internet aloqasi uzildi. Qayta urinib ko'ring.");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isTelegramLoginConfigured()) return;

    setWidgetState("loading");

    // Telegram widget callback'ni kutmaydi (Promise qaytarmaydi), shuning
    // uchun natija shu yerda ushlanadi.
    window[callbackName] = (user: TelegramAuthUser) => {
      void handleAuth(user);
    };

    const container = containerRef.current;
    let settled = false;

    // Konteynerni KUZATAMIZ: Telegram tugmani iframe sifatida qo'shadi.
    // Reklama-bloklovchilar ko'pincha skriptni tarmoq xatosiz, BO'SH javob
    // bilan "muvaffaqiyatli" yuklaydi — shu holatda `onerror` chaqirilmaydi
    // va iframe HECH QACHON paydo bo'lmaydi. Shuning uchun haqiqiy natija
    // (`onload` emas) — konteynerda iframe borligi.
    const observer = new MutationObserver(() => {
      if (container?.querySelector("iframe")) {
        settled = true;
        observer.disconnect();
        setWidgetState("ready");
      }
    });
    if (container) observer.observe(container, { childList: true });

    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        observer.disconnect();
        setWidgetState("failed");
      }
    }, RENDER_TIMEOUT_MS);

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.setAttribute("data-telegram-login", getTelegramLoginBotUsername());
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-onauth", `${callbackName}(user)`);
    script.setAttribute("data-request-access", "write");
    // Haqiqiy tarmoq xatosi (masalan DNS/CSP) bo'lsa buni kutmasdan darhol
    // ko'rsatamiz — yuqoridagi kuzatuvchi esa "jim blok" holatini ushlaydi.
    script.onerror = () => {
      if (!settled) {
        settled = true;
        observer.disconnect();
        window.clearTimeout(timeoutId);
        setWidgetState("failed");
      }
    };
    container?.appendChild(script);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeoutId);
      // `replaceChildren()` argumentsiz — xavfsiz tozalash, `innerHTML`
      // orqali emas (bo'sh qiymat bo'lsa ham, statik tekshiruvchilar
      // `innerHTML` yozuvini har doim shubhali deb belgilaydi).
      container?.replaceChildren();
      delete window[callbackName];
    };
    // `callbackName` (useId dan) barqaror — widget shu sabab qayta chizilmaydi.
    // `retryToken` o'zgarsa effekt qaytadan ishlaydi — "Qayta urinish" shu orqali.
  }, [callbackName, handleAuth, retryToken]);

  if (!isTelegramLoginConfigured()) return null;

  return (
    <div className={className}>
      <div className="relative" style={{ minHeight: WIDGET_HEIGHT_PX }}>
        {/*
          Skelet vidjet KELGUNCHA aynan o'sha joyni egallaydi — tugma
          chizilganda sahifa sakramaydi (layout shift bo'lmaydi).
        */}
        {widgetState === "loading" && (
          <div
            className="absolute inset-0 animate-pulse rounded-[10px] bg-[#2AABEE]/15"
            aria-hidden="true"
          />
        )}
        <div
          ref={containerRef}
          className="relative flex justify-center"
          style={{ minHeight: WIDGET_HEIGHT_PX }}
        />
      </div>

      {widgetState === "failed" && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          <p>
            Telegram tugmasi yuklanmadi. Reklama bloklovchi kengaytma yoki
            brauzerning maxfiylik sozlamasi sabab bo'lishi mumkin.{" "}
            <button
              type="button"
              onClick={() => setRetryToken((v) => v + 1)}
              className="font-semibold underline underline-offset-2"
            >
              Qayta urinish
            </button>
          </p>
        </div>
      )}

      {busy && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {mode === "link" ? "Bog'lanmoqda..." : "Kirilmoqda..."}
        </p>
      )}
    </div>
  );
}

export default TelegramLoginButton;
