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

interface Props {
  /** Token olinganda chaqiriladi. Bo'sh satr = token yo'q/eskirdi. */
  onVerify: (token: string) => void;
  /** Serverdagi log uchun belgi (masalan "signup"). */
  action?: string;
  /** Interfeys tili. */
  language?: string;
  className?: string;
}

export interface TurnstileHandle {
  reset: () => void;
}

export function Turnstile({ onVerify, action = 'signup', language, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const [failed, setFailed] = useState(false);
  const uid = useId();

  // Callback o'zgarsa widget qayta yaratilmasligi uchun ref orqali saqlaymiz
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  const cfLang = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'uz';

  useEffect(() => {
    if (!isTurnstileConfigured()) {
      // Sozlanmagan — formani bloklamaymiz
      onVerifyRef.current('');
      return;
    }

    let cancelled = false;

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
          callback: (token: string) => onVerifyRef.current(token),
          'expired-callback': () => onVerifyRef.current(''),
          'timeout-callback': () => onVerifyRef.current(''),
          'error-callback': () => {
            onVerifyRef.current('');
            setFailed(true);
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
    // uid — komponent nusxasi uchun barqaror kalit
  }, [action, cfLang, uid]);

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
