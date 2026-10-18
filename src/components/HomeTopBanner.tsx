import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock, Crown, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/track";
import { formatProDate } from "@/lib/proRenewal";
import { hasStoredSession } from "@/lib/hasStoredSession";
import MobileAppBanner from "@/components/MobileAppBanner";
import ReadinessStrip from "@/components/ReadinessStrip";

/**
 * Obuna tugashiga shuncha kun qolganda banner ko'rinadi.
 *
 * ILGARI 3 EDI: foydalanuvchiga 3 kun oldin ko'rsatilishi haligacha
 * "shoshilinch emas" tuyulib, e'tiborsiz qoldirilardi. 1 kun — obuna
 * chindan ham tugash arafasida bo'lgandagina ko'rinadi, shu payt xabar
 * ham dolzarbroq, ham kamroq zerikarli takrorlanadi.
 */
const RENEW_WINDOW_DAYS = 1;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "PRO tugadi" tasmasi shuncha kun ichida tugaganlarga ko'rinadi (2.4). */
const EXPIRED_WINDOW_DAYS = 14;

/** Haftalik deb hisoblanadigan eng katta muddat (7 kun + admin qo'lda bergan 8 kun). */
const WEEKLY_MAX_DAYS = 8;

/**
 * Yopilgan banner qaysi obuna uchun yopilganini saqlaydi (tugash sanasi).
 * Shuning uchun keyingi obunada banner yana ko'rinadi — "bir marta yopdim,
 * boshqa hech qachon ko'rmayman" holati bo'lmaydi.
 */
const DISMISS_KEY = "pro-renew-banner-dismissed";

interface UpgradeOffer {
  /** Oylik tarif haftalikka nisbatan necha foiz arzon (kunlik narx bo'yicha). */
  percent: number;
}

/**
 * Bosh sahifa yuqorisidagi BITTA tasma.
 *
 * Bu slotda BITTA element ko'rsatiladi, ustuvorlik bo'yicha:
 *
 *   1. Obunasi 1 kun ichida tugaydigan foydalanuvchi → uzaytirish taklifi
 *      (bitta o'zi, chunki bu vaqtga bog'liq va eng muhim xabar).
 *   2. Aks holda: mobil ilova banneri (faqat telefonda) va uning OSTIDA
 *      kirgan foydalanuvchi uchun tayyorgarlik tasmasi.
 *
 * KOMPYUTER ILOVASI banneri bu yerdan OLIB TASHLANDI: u har bir tashrifda
 * eng qimmatli joyni egallardi, lekin o'lchanadigan foyda bermasdi. Ilova
 * havolasi menyuda va "Qo'shimcha" bo'limida qoldi.
 */
export function HomeTopBanner() {
  const { user, isLoading: authLoading } = useAuth();
  const { isPremium, expiresAt, state: accessState } = useAccessState();
  const { t } = useLanguage();

  /**
   * Tayyorgarlik tasmasi uchun joy BIRINCHI RENDERDA zahiralanadi: `user`
   * sessiya o'qilguncha `null`, shu sababli ilgari tasma kechikib paydo
   * bo'lib hero'ni pastga surardi. Saqlangan sessiya bo'lsa — darhol skelet
   * (Home dagi profil paneli bilan bir xil qoida, `hasStoredSession`).
   */
  const [expectsSession] = useState(hasStoredSession);
  const showStrip = !!user || (authLoading && expectsSession);

  const [dismissedFor, setDismissedFor] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY);
    } catch {
      return null;
    }
  });
  const [offer, setOffer] = useState<UpgradeOffer | null>(null);
  const viewTrackedRef = useRef(false);

  const expiryKey = expiresAt ? expiresAt.toISOString() : null;
  const msLeft = expiresAt ? expiresAt.getTime() - Date.now() : null;
  const eligible =
    !!user &&
    isPremium &&
    msLeft !== null &&
    msLeft > 0 &&
    msLeft <= RENEW_WINDOW_DAYS * DAY_MS;
  const dismissed = !!expiryKey && dismissedFor === expiryKey;
  const showRenew = eligible && !dismissed;

  /**
   * Taklif ma'lumoti faqat SHU banner ko'rinadigan bo'lsa o'qiladi — ya'ni
   * foydalanuvchilarning juda kichik qismi uchun. Bosh sahifa qolgan hamma
   * uchun bitta ham qo'shimcha so'rov qilmaydi.
   */
  useEffect(() => {
    if (!showRenew || !user) return;
    let cancelled = false;

    void (async () => {
      const [subRes, plansRes] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("tariff_days")
          .eq("user_id", user.id)
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("payme_plans")
          .select("plan_name, amount_tiyin, tariff_days")
          .eq("is_active", true),
      ]);

      if (cancelled) return;

      /*
        PRO ikki manbadan kelishi mumkin (`get_user_access_state` shunday
        yozilgan): `subscriptions` jadvali yoki eski `profiles.tariff_days`.
        Bu yerda faqat birinchisini o'qiymiz — hozir ikkinchi yo'l bilan PRO
        olgan atigi 1 ta foydalanuvchi bor, va unga taqqoslashsiz oddiy
        "uzaytiring" matni ko'rinadi (noto'g'ri narsa ko'rsatilmaydi).
      */
      const currentDays = subRes.data?.tariff_days ?? null;
      const plans = plansRes.data ?? [];
      const weekly = plans.find((p) => p.plan_name === "weekly");
      const monthly = plans.find((p) => p.plan_name === "monthly");

      // Taqqoslash faqat haftalik obunachiga mantiqiy: oylikdagi odamga
      // "oylik arzonroq" deyishning ma'nosi yo'q.
      if (
        currentDays === null ||
        currentDays > WEEKLY_MAX_DAYS ||
        !weekly?.tariff_days ||
        !monthly?.tariff_days
      ) {
        return;
      }

      const weeklyPerDay = weekly.amount_tiyin / weekly.tariff_days;
      const monthlyPerDay = monthly.amount_tiyin / monthly.tariff_days;
      if (!(monthlyPerDay < weeklyPerDay)) return;

      setOffer({
        percent: Math.round((1 - monthlyPerDay / weeklyPerDay) * 100),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [showRenew, user]);

  useEffect(() => {
    if (!showRenew || viewTrackedRef.current || msLeft === null) return;
    viewTrackedRef.current = true;
    trackEvent("renew_banner_view", { days_left: Math.ceil(msLeft / DAY_MS) });
  }, [showRenew, msLeft]);

  /*
    "PRO tugadi" tasmasi (2.4): muddati oxirgi EXPIRED_WINDOW_DAYS kunda
    tugaganlar. Tugash sanasi `get_user_access_state` da yo'q (expired_pro
    uchun null), shuning uchun FAQAT shu holatdagi foydalanuvchida o'z
    profilidan bitta so'rov bilan o'qiladi — boshqalar uchun so'rov yo'q.
  */
  const [expiredEnd, setExpiredEnd] = useState<Date | null>(null);
  useEffect(() => {
    if (!user || accessState !== "expired_pro") {
      setExpiredEnd(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("tariff_end_date")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled || !data?.tariff_end_date) return;
        const end = new Date(data.tariff_end_date);
        const ago = Date.now() - end.getTime();
        setExpiredEnd(ago > 0 && ago <= EXPIRED_WINDOW_DAYS * DAY_MS ? end : null);
      } catch {
        /* tasma ixtiyoriy — xato bo'lsa ko'rsatilmaydi */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, accessState]);

  const expiredKey = expiredEnd ? `expired:${expiredEnd.toISOString()}` : null;
  const showExpired = !showRenew && !!expiredKey && dismissedFor !== expiredKey;
  const expiredTrackedRef = useRef(false);
  useEffect(() => {
    if (!showExpired || !expiredEnd || expiredTrackedRef.current) return;
    expiredTrackedRef.current = true;
    trackEvent("expired_banner_view", { days_ago: Math.floor((Date.now() - expiredEnd.getTime()) / DAY_MS) });
  }, [showExpired, expiredEnd]);

  const dismissFor = (key: string | null) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!key) return;
    try {
      localStorage.setItem(DISMISS_KEY, key);
    } catch {
      /* ignore */
    }
    setDismissedFor(key);
  };

  if (showExpired && expiredEnd) {
    return (
      <div className="relative z-10 w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="flex min-h-14 items-center gap-1 px-2 lg:px-3 py-2 max-w-7xl mx-auto">
          <button
            type="button"
            onClick={dismissFor(expiredKey)}
            aria-label={t("pro.renewClose")}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white/80 hover:text-white hover:bg-white/15 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <Link
            to="/pro"
            onClick={() =>
              trackEvent("expired_banner_click", {
                days_ago: Math.floor((Date.now() - expiredEnd.getTime()) / DAY_MS),
              })
            }
            className="flex-1 min-w-0 group rounded-lg hover:bg-white/10 transition-colors px-1.5 py-0.5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 border border-white/25">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-tight">
                    {t("pro.expiredTitle").replace("{date}", formatProDate(expiredEnd))}
                  </p>
                  <p className="text-[11px] leading-tight mt-px text-white/90">{t("pro.expiredSub")}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-orange-600 px-3 py-1.5 rounded-full shrink-0 shadow-sm group-hover:bg-white/90 transition-colors">
                {t("pro.expiredCta")}
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  if (!showRenew || msLeft === null) {
    return (
      <>
        <MobileAppBanner />
        {showStrip && <ReadinessStrip pending={!user} />}
      </>
    );
  }

  const handleDismiss = dismissFor(expiryKey);

  const daysLeft = Math.ceil(msLeft / DAY_MS);
  const title =
    msLeft < DAY_MS
      ? t("pro.renewTitleToday")
      : t("pro.renewTitleDays").replace("{n}", String(daysLeft));
  const subtitle = offer
    ? t("pro.renewSubWeekly").replace("{p}", String(offer.percent))
    : t("pro.renewSubDefault");

  return (
    <div className="relative z-10 w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white">
      {/* `min-h-14` — tayyorgarlik tasmasi bilan bir xil: almashganda hero surilmaydi */}
      <div className="flex min-h-14 items-center gap-1 px-2 lg:px-3 py-2 max-w-7xl mx-auto">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t("pro.renewClose")}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white/80 hover:text-white hover:bg-white/15 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <Link
          to="/pro"
          onClick={() =>
            trackEvent("renew_banner_click", {
              days_left: daysLeft,
              offer: offer ? "weekly_to_monthly" : "renew",
            })
          }
          className="flex-1 min-w-0 group rounded-lg hover:bg-white/10 transition-colors px-1.5 py-0.5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 border border-white/25">
                <Crown className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight">{title}</p>
                <p className="text-[11px] leading-tight mt-px flex items-center gap-1 text-white/90">
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                  {subtitle}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-orange-600 px-3 py-1.5 rounded-full shrink-0 shadow-sm group-hover:bg-white/90 transition-colors">
              {t("pro.renewCta")}
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default HomeTopBanner;
