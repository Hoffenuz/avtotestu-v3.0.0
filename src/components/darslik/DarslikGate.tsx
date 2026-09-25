/**
 * Darslik bo'limining umumiy qobig'i: maket + sinov rejimi xabari.
 *
 * KIRISH SHARTI YO'Q (2026-09):
 *   Ilgari bu yerda PRO tekshiruvi turardi. Bo'lim hozir ochiq sinovda —
 *   yangi pleyer, yangi dars nomlari va progress hisobi haqiqiy
 *   foydalanuvchilarda sinalishi kerak, PRO devori esa sinovchilar sonini
 *   keskin kamaytirardi. Kirish ham talab qilinmaydi: progress brauzerda
 *   saqlanadi, ya'ni mehmon ham darslardan to'liq foydalana oladi.
 *
 *   QAYTARISH OSON: PRO talabini tiklash uchun shu faylga `useProAccess`
 *   va `ProAccessGate` ni qaytarish kifoya — sahifalar tegilmaydi,
 *   ikkalasi ham shu qobiqdan o'tadi.
 *
 * Ikkala darslik sahifasi (modullar ro'yxati va modul ichi) shu qobiqdan
 * o'tadi, shuning uchun sinov xabari ikki joyda ayri yozilmaydi.
 */
import type { ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export function DarslikGate({ children }: { children: ReactNode }) {
  const { t } = useLanguage();

  return (
    <MainLayout>
      {/*
        Xabar sahifaning eng tepasida, kontentdan OLDIN: foydalanuvchi
        nosozlikka duch kelgandan keyin emas, undan oldin bilishi kerak.
        Rang — `warning` tokeni, qizil emas: bu ogohlantirish, xato emas.
        Matn faqat "Test rejimida" — uzun izoh (bepul, nosozlik haqida
        yozing) ortiqcha edi.
      */}
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
