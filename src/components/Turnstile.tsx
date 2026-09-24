/**
 * Turnstile — Cloudflare "men robot emasman" tekshiruvi.
 *
 * Widget token beradi, token esa `verify-turnstile` Edge Function orqali
 * SERVERDA tekshiriladi. Frontenddagi token o'z-o'zicha hech narsani
 * isbotlamaydi — shuning uchun tekshiruvni chetlab o'tib bo'lmaydi.
 *
 * Site key sozlanmagan bo'lsa komponent `onVerify('')` chaqiradi va ko'rinmaydi
 * — bu holda forma bloklanmasin (masalan lokal ishlab chiqishda).
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { getTurnstileSiteKey, isTurnstileConfigured } from '@/lib/turnstile';

const SITE_KEY = getTurnstileSiteKey();
const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onloadTurnstileCallback?: () => void;
  }
}

/** Skriptni bir marta yuklaydi (bir nechta widget bo'lsa ham). */
function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('turnstile_script')), { once: true });
      if (window.turnstile) resolve();
    });
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile_script'));
    document.head.appendChild(s);
  });
}

/**
 * Tekshiruv "yuklanmadi" deb hisoblanadigan vaqt.
 *
 * Cloudflare widget'i normal sharoitda 1-2 soniyada chiziladi. Agar shu
 * muddatda token kelmasa — skript bloklangan, tarmoq sekin yoki widget
 * qotib qolgan. Bunday holatda foydalanuvchini "men robot emasman" da
 * abadiy ushlab turish mumkin emas: u shunchaki ketib qoladi.
 */
const UNAVAILABLE_AFTER_MS = 7000;

interface Props {
  /** Token olinganda chaqiriladi. Bo'sh satr = token yo'q/eskirdi. */
  onVerify: (token: string) => void;
  /**
   * Tekshiruvni KO'RSATIB BO'LMADI (xato yoki {@link UNAVAILABLE_AFTER_MS}
   * ichida token kelmadi). Chaqiruvchi shu paytda formani ochishi kerak —
   * himoya serverdagi chastota cheklovi zimmasiga o'tadi.
   */
  onUnavailable?: () => void;
  /** Serverdagi log uchun belgi (masalan "signup"). */
  action?: string;
  /** Interfeys tili. */
  language?: string;
  className?: string;
}

export interface TurnstileHandle {
  reset: () => void;
}

export function Turnstile({ onVerify, onUnavailable, action = 'signup', language, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onUnavailableRef = useRef(onUnavailable);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [failed, setFailed] = useState(false);
  const uid = useId();

  // Callback o'zgarsa widget qayta yaratilmasligi uchun ref orqali saqlaymiz
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onUnavailableRef.current = onUnavailable;
  }, [onVerify, onUnavailable]);

  /** Taymerni bekor qiladi — token kelgach yoki komponent yo'qolganda. */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Tekshiruvni ko'rsatib bo'lmadi: formani ochib yuborishni so'raymiz. */
  const markUnavailable = useCallback(() => {
    clearTimer();
    setFailed(true);
    onUnavailableRef.current?.();
  }, [clearTimer]);

  /**
   * Cloudflare o'zbek tilini (`uz`) QO'LLAB-QUVVATLAMAYDI — uni uzatsak
   * konsolda ogohlantirish chiqadi va baribir inglizchaga tushadi.
   * Shuning uchun o'zbek uchun `auto`: widget brauzer tilidan kelib
   * chiqib o'zi eng mosini tanlaydi.
   */
  const cfLang = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'auto';

  useEffect(() => {
    if (!isTurnstileConfigured()) {
      // Sozlanmagan — formani bloklamaymiz
      onVerifyRef.current('');
      return;
    }

    let cancelled = false;

    /*
      Taymer skriptni YUKLASHDAN OLDIN qo'yiladi — ataylab.
      Eng yomon holat aynan skript umuman kelmasligi (tarmoq bloklagan yoki
      juda sekin): u holda `.then()` ham, `.catch()` ham ishlamaydi va
      hech qanday hodisa chiqmaydi. Taymer esa baribir ishga tushadi.
    */
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (!cancelled) markUnavailable();
    }, UNAVAILABLE_AFTER_MS);

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        // Qayta render bo'lsa eski widget'ni tozalaymiz
        if (widgetIdRef.current) {
          try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
          widgetIdRef.current = null;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          action,
          language: cfLang,
          theme: 'auto',
          callback: (token: string) => {
            // Token keldi — hammasi joyida, ogohlantirish kerak emas.
            clearTimer();
            setFailed(false);
            onVerifyRef.current(token);
          },
          'expired-callback': () => onVerifyRef.current(''),
          'timeout-callback': () => {
            onVerifyRef.current('');
            markUnavailable();
          },
          'error-callback': () => {
            onVerifyRef.current('');
            markUnavailable();
          },
        });
      })
      .catch(() => {
        if (!cancelled) markUnavailable();
      });

    return () => {
      cancelled = true;
      clearTimer();
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
    // uid — komponent nusxasi uchun barqaror kalit
  }, [action, cfLang, uid, clearTimer, markUnavailable]);

  const retry = useCallback(() => {
    setFailed(false);
    if (widgetIdRef.current && window.turnstile) {
      try { window.turnstile.reset(widgetIdRef.current); } catch { /* ignore */ }
    }
  }, []);

  if (!isTurnstileConfigured()) return null;

  return (
    <div className={className}>
      {/*
        Balandlik OLDINDAN band qilinadi (Cloudflare widget'i 65px).
        Aks holda skript yuklangach widget "paydo bo'lib", ostidagi tugmalarni
        pastga surib yuboradi va sahifa sakraydi.
      */}
      <div
        ref={containerRef}
        className="flex justify-center items-center min-h-[65px]"
      />
      {failed && (
        <button
          type="button"
          onClick={retry}
          className="mt-1 w-full text-xs text-primary hover:underline"
        >
          Tekshiruv yuklanmadi — qayta urinish
        </button>
      )}
    </div>
  );
}
