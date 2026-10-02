// ============================================================================
// attribution — foydalanuvchi QAYERDAN kelgani (Instagram reklamasi, Telegram,
// Google ...) va u ro'yxatdan o'tganda bazaga yozilishi.
// ----------------------------------------------------------------------------
// NEGA: Instagram target yoqishdan oldin "reklamadan nechta odam keldi,
// nechtasi ro'yxatdan o'tdi va nechtasi PRO oldi" degan savolga javob kerak.
// GA4 kirishni ko'radi, lekin TO'LOVNI emas — to'lov bazada. Shuning uchun
// manba akkauntga bog'lab bazaga yoziladi (`user_attribution`), hisobot esa
// `admin_attribution_report()` (faqat service_role).
//
// QOIDA — "oxirgi tashqi manba": UTM yoki tashqi sahifadan kelgan har
// tashrif manbani yangilaydi; to'g'ridan-to'g'ri (manzilni yozib yoki
// xatcho'pdan) kirish esa ESKI manbani O'CHIRMAYDI. Ya'ni Instagram
// reklamasidan kelib, ertasi kuni o'zi qaytib ro'yxatdan o'tgan odam
// baribir "instagram" bo'lib qoladi. Manba 30 kundan keyin eskiradi.
//
// Manbani aniqlash tartibi:
//   1) `utm_source` (+ medium / campaign / content / term) — reklama
//      havolalarida SHART (masalan `?utm_source=instagram&utm_medium=paid
//      &utm_campaign=okt_1`);
//   2) Instagram / Facebook ichki brauzeri (user-agent) — bio yoki
//      storis havolasi UTM siz bosilganda ham;
//   3) referrer (instagram.com, t.me, google ...);
//   4) `fbclid` — Meta reklamasi yoki havolasi (aniq platformasiz).
// Bazaga faqat YANGI akkaunt yoziladi (server ham tekshiradi: 2 kun).
// Analitika hech qachon saytni buzmasligi kerak — hamma joyda try/catch.
// ============================================================================

import { supabase } from "@/integrations/supabase/client";

const STORE_KEY = "avtosmart-attribution";
const SENT_PREFIX = "avtosmart-attr-sent:";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface Attribution {
  source: string;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  referrerHost: string | null;
  landingPath: string;
  fbclid: boolean;
  /** Shu manba birinchi ko'rilgan vaqt (ms). */
  ts: number;
}

const OAUTH_OR_PAYMENT_HOSTS = [
  "accounts.google.com", "accounts.google.co.uz", "oauth.telegram.org", "supabase.co",
  "paycom.uz", "payme.uz", "click.uz", "challenges.cloudflare.com",
];

/** Referrer hosti → manba. `null` — o'z sayt yoki noma'lum. */
export function sourceFromHost(host: string): { source: string; medium: string } | null {
  const h = host.toLowerCase().replace(/^www\./, "");
  if (!h || h.endsWith("avtotestu.uz") || h.endsWith("pages.dev") || h === "localhost") return null;
  // Kirish (OAuth) va to'lov sahifalaridan qaytish — yangi manba EMAS:
  // aks holda Instagram'dan kelib Google orqali kirgan odam "google" bo'lib qolardi.
  if (OAUTH_OR_PAYMENT_HOSTS.some((x) => h === x || h.endsWith("." + x))) return null;
  if (h.includes("instagram")) return { source: "instagram", medium: "social" };
  if (h.includes("facebook") || h === "fb.com" || h === "m.me") return { source: "facebook", medium: "social" };
  if (h === "t.me" || h.includes("telegram")) return { source: "telegram", medium: "social" };
  if (h.includes("youtube") || h === "youtu.be") return { source: "youtube", medium: "social" };
  if (h.includes("tiktok")) return { source: "tiktok", medium: "social" };
  if (/(^|\.)google\./.test(h) || h.startsWith("google.")) return { source: "google", medium: "organic" };
  if (h.includes("yandex")) return { source: "yandex", medium: "organic" };
  if (h.includes("bing.")) return { source: "bing", medium: "organic" };
  return { source: h.slice(0, 40), medium: "referral" };
}

function hostOf(referrer: string): string {
  if (!referrer) return "";
  // Android ilovalari: "android-app://com.instagram.android/"
  const app = referrer.match(/^android-app:\/\/([^/]+)/);
  if (app) return app[1];
  try {
    return new URL(referrer).hostname;
  } catch {
    return "";
  }
}

/**
 * Joriy tashrifning manbasi. To'g'ridan-to'g'ri kirishda `null` (eski manba
 * saqlanib qoladi). Sof funksiya — test qilinadi.
 */
export function detectAttribution(input: {
  search: string;
  referrer: string;
  userAgent: string;
  pathname: string;
  now?: number;
}): Attribution | null {
  const params = new URLSearchParams(input.search);
  const get = (k: string) => {
    const v = params.get(k)?.trim();
    return v ? v.slice(0, 100) : null;
  };
  const fbclid = params.has("fbclid");
  const refHost = hostOf(input.referrer);
  const base = {
    content: get("utm_content"),
    term: get("utm_term"),
    referrerHost: refHost ? refHost.slice(0, 100) : null,
    landingPath: input.pathname.slice(0, 200),
    fbclid,
    ts: input.now ?? Date.now(),
  };

  const utmSource = get("utm_source");
  if (utmSource) {
    return { ...base, source: utmSource.toLowerCase(), medium: get("utm_medium")?.toLowerCase() ?? null, campaign: get("utm_campaign") };
  }
  // Ichki brauzerlar: Instagram/Facebook ilovasi ichida ochilgan havola.
  if (/\bInstagram\b/i.test(input.userAgent)) {
    return { ...base, source: "instagram", medium: fbclid ? "paid_or_link" : "social", campaign: null };
  }
  if (/\bFBAN|FBAV|FB_IAB\b/.test(input.userAgent)) {
    return { ...base, source: "facebook", medium: "social", campaign: null };
  }
  const fromRef = refHost ? sourceFromHost(refHost) : null;
  if (fromRef) return { ...base, ...fromRef, campaign: null };
  if (fbclid) return { ...base, source: "meta", medium: "paid_or_link", campaign: null };
  return null;
}

export function readAttribution(now = Date.now()): Attribution | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Attribution;
    if (!a || typeof a.source !== "string" || typeof a.ts !== "number" || now - a.ts > MAX_AGE_MS) return null;
    return a;
  } catch {
    return null;
  }
}

/** Sahifa ochilganda BIR MARTA (main.tsx) — React'dan oldin, Telegram fragmentni o'qishdan oldin. */
export function captureAttribution(): void {
  try {
    if (typeof window === "undefined") return;
    const { search, pathname, hash } = window.location;
    let found = detectAttribution({
      search,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      pathname,
    });
    // Telegram Mini App ichida ochilgan sayt
    if (!found && hash.includes("tgWebAppData")) {
      found = { source: "telegram", medium: "mini_app", campaign: null, content: null, term: null, referrerHost: null, landingPath: pathname, fbclid: false, ts: Date.now() };
    }
    if (found) localStorage.setItem(STORE_KEY, JSON.stringify(found));
  } catch {
    /* private rejim yoki bloklangan saqlash — o'tkazib yuboramiz */
  }
}

/**
 * Kirgan foydalanuvchi uchun manbani bazaga yuboradi (bir marta). Server
 * faqat 2 kundan yangi akkauntni yozadi; eski akkaunt uchun ham belgi
 * qo'yiladi — qayta-qayta so'ralmasin. Manba yo'q bo'lsa — "direct".
 */
export async function recordSignupAttribution(userId: string, userCreatedAt?: string): Promise<void> {
  try {
    const sentKey = SENT_PREFIX + userId;
    if (localStorage.getItem(sentKey)) return;
    // Aniq eski akkaunt — so'rov ham yuborilmaydi.
    if (userCreatedAt && Date.now() - new Date(userCreatedAt).getTime() > 2 * 24 * 60 * 60 * 1000) {
      localStorage.setItem(sentKey, "old");
      return;
    }
    const a = readAttribution();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC generatsiya qilingan turlarda hali yo'q
    const { data, error } = await (supabase as any).rpc("record_signup_attribution", {
      p_source: a?.source ?? "direct",
      p_medium: a?.medium ?? null,
      p_campaign: a?.campaign ?? null,
      p_content: a?.content ?? null,
      p_term: a?.term ?? null,
      p_referrer_host: a?.referrerHost ?? null,
      p_landing_path: a?.landingPath ?? null,
      p_fbclid: a?.fbclid ?? false,
      p_first_seen_at: a ? new Date(a.ts).toISOString() : null,
    });
    if (error) return; // keyingi kirishda qayta urinadi
    localStorage.setItem(sentKey, String(data ?? "1"));
  } catch {
    /* analitika saytni hech qachon buzmaydi */
  }
}
