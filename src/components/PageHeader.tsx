// ============================================================================
// PageHeader — ichki sahifalar uchun sarlavha va "orqaga" tugmasi
// ----------------------------------------------------------------------------
// NEGA `navigate(-1)` EMAS:
//   Foydalanuvchi sahifaga to'g'ridan-to'g'ri (havola yoki qidiruv orqali)
//   kirgan bo'lsa, brauzer tarixi bo'sh bo'ladi va `-1` uni saytdan
//   CHIQARIB YUBORARDI. Shuning uchun tarix bor-yo'qligi tekshiriladi:
//   bor bo'lsa orqaga, yo'q bo'lsa `fallback` sahifasiga.
// ============================================================================

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Tarix bo'sh bo'lganda qaytiladigan sahifa. */
  fallback?: string;
  /** O'ng tomondagi qo'shimcha element (masalan filtr tugmasi). */
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  fallback = "/bolimlar",
  action,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const goBack = useCallback(() => {
    // `idx` — React Router saqlaydigan tarix pozitsiyasi. 0 bo'lsa,
    // bu sessiyada orqaga qaytadigan sahifa yo'q.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);

  return (
    <div className="mb-5 flex items-start gap-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={goBack}
        aria-label={t("pages.back")}
        className="mt-0.5 h-8 w-8 shrink-0 p-0"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-semibold text-foreground md:text-xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
