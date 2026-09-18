/**
 * Darslik bo'limining kirish shartlari — BITTA joyda.
 *
 * Darslik endi ikki sahifadan iborat (modullar ro'yxati va modul ichi).
 * Gate mantiqi ikkalasida ayri yozilsa, biri PRO tekshiruvini o'tkazib
 * yuborishi mumkin edi — ya'ni pullik bo'lim havolani bilgan har kimga
 * ochilib qolardi. Shuning uchun ikkala sahifa ham shu qobiqdan o'tadi.
 */
import type { ReactNode } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProAccessGate } from "@/components/ProAccessGate";
import { SEO } from "@/components/SEO";
import { useAccessState } from "@/hooks/useAccessState";
import { useAuth } from "@/contexts/AuthContext";
import { useProAccess } from "@/hooks/useProAccess";
import { useLanguage } from "@/contexts/LanguageContext";

interface DarslikGateProps {
  /** Kirish tiklangandan keyin qaytiladigan manzil. */
  returnPath: string;
  children: ReactNode;
}

export function DarslikGate({ returnPath, children }: DarslikGateProps) {
  const { t } = useLanguage();
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
        <div className="grid min-h-[60vh] place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        {seo}
        <ProAccessGate section="darslik" reason="guest" returnPath={returnPath} />
      </MainLayout>
    );
  }

  if (!backendConfirmed) {
    return (
      <MainLayout>
        {seo}
        <ProAccessGate section="darslik" reason="backend" returnPath={returnPath} onRetry={refresh} />
      </MainLayout>
    );
  }

  if (!hasAccess) {
    return (
      <MainLayout>
        {seo}
        <ProAccessGate section="darslik" reason="no_pro" returnPath={returnPath} />
      </MainLayout>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}
