// Saqlangan savollar — foydalanuvchi test paytida saqlab qo'ygan savollar.
// Shaxsiy sahifa — qidiruv tizimlariga indekslanmaydi.

import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { SavedWrongList } from "@/components/SavedWrongList";

export default function Saqlangan() {
  const { t } = useLanguage();

  return (
    <MainLayout>
      <SEO
        title={t("sections.saqlangan")}
        description="Keyinroq qaytib ko'rish uchun saqlab qo'ygan savollaringiz."
        path="/saqlangan"
        noIndex
      />

      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <PageHeader title={t("sections.saqlangan")} description={t("pages.saqlanganDesc")} />

        <SavedWrongList mode="saved" />
      </div>
    </MainLayout>
  );
}
