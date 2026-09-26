/**
 * Darslik bo'limining kirish sharti va umumiy qobig'i — BITTA joyda.
 *
 * VIDEO DARSLIK — PRO ICHIDA (2026-09-26, egasining qarori):
 *   2026-09-18 da bo'lim "ochiq sinov" deb hammaga bepul ochilgan edi — bu
 *   egasi bilan kelishilmagan edi. Video va audio darslar PRO ichida
 *   (bitta narx, alohida tarif yo'q). PRO talabi qaytarildi.
 *
 * Ikkala darslik sahifasi (modullar ro'yxati va modul ichi) shu qobiqdan
 * o'tadi. Gate mantiqi ikkalasida ayri yozilsa, biri PRO tekshiruvini
 * o'tkazib yuborishi mumkin edi — pullik bo'lim havolani bilgan har kimga
 * ochilib qolardi.
 *
 * "Test rejimida" belgisi faqat PRO egasiga (darslik ichida) ko'rinadi:
 * pleyer va dars nomlari hali sinovda.
 */
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProAccessGate } from "@/components/ProAccessGate";
import { SEO } from "@/components/SEO";
import { useAccessState } from "@/hooks/useAccessState";
import { useAuth } from "@/contexts/AuthContext";
import { useProAccess } from "@/hooks/useProAccess";
import { useLanguage } from "@/contexts/LanguageContext";

interface DarslikGateProps {
  children: ReactNode;
  /** Kirish/PRO olingandan keyin qaytiladigan manzil (standart — joriy sahifa). */
  returnPath?: string;
}

export function DarslikGate({ children, returnPath }: DarslikGateProps) {
  const { t } = useLanguage();
  const location = useLocation();
  const qaytish = returnPath ?? location.pathname;
  const { user, isLoading } = useAuth();
  const { hasAccess, loading: accessLoading } = useProAccess({
    redirectPath: "/pro",
    redirectGuestsToAuth: false,
    redirectWithoutAccess: false,
  });
  const { backendConfirmed, refresh } = useAccessState();

  const seo = (
    <SEO
      title={t("seo.darslik.title")}
      description={t("seo.darslik.description")}
      path="/darslik"
      keywords={t("seo.darslik.keywords")}
    />
  );

  if (isLoading || accessLoading) {
    return (
      <MainLayout>
        <div className="grid min-h-[60vh] place-items-center" role="status">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        {seo}
        <ProAccessGate section="darslik" reason="guest" returnPath={qaytish} />
      </MainLayout>
    );
  }

  if (!backendConfirmed) {
    return (
      <MainLayout>
        {seo}
        <ProAccessGate section="darslik" reason="backend" returnPath={qaytish} onRetry={refresh} />
      </MainLayout>
    );
  }

  if (!hasAccess) {
    return (
      <MainLayout>
        {seo}
        <ProAccessGate section="darslik" reason="no_pro" returnPath={qaytish} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Sinov belgisi — kontentdan OLDIN; rang `warning` (ogohlantirish, xato emas). */}
      <div className="border-b border-warning/25 bg-warning/10">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2">
          <FlaskConical className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          <p className="text-xs font-semibold leading-snug text-foreground sm:text-[13px]">
            {t("darslik.betaTitle")}
          </p>
        </div>
      </div>

      {children}
    </MainLayout>
  );
}
