// ============================================================================
// ProSectionGate — butun bo'limni PRO obunaga bog'lash
// ----------------------------------------------------------------------------
// NEGA ALOHIDA KOMPONENT:
//   Kirish tekshiruvi to'rt holatdan iborat (yuklanmoqda / mehmon / server
//   javob bermadi / PRO yo'q). Uni har sahifada qaytadan yozish — o'sha
//   holatlardan birini unutib qo'yish demakdir. Eng xavflisi
//   `backendConfirmed` ni unutish: server javob bermaganda foydalanuvchi
//   PRO bo'lsa ham "obuna yo'q" degan xabarni ko'rardi.
//
// MUHIM: bu FAQAT interfeys darajasidagi to'siq. Haqiqiy himoya serverda —
// savollar bazasi (`barcha-*.json`) PRO bo'lmaganlarga baribir berilmaydi,
// izohlar esa `record`/`session` RPC lari orqali tekshiriladi.
// ============================================================================

import type { ReactNode } from "react";
import { ProAccessGate, type GateSection } from "@/components/ProAccessGate";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useProAccess } from "@/hooks/useProAccess";

interface ProSectionGateProps {
  section: GateSection;
  /** Kirish bo'lmasa qaytariladigan manzil (kirgandan keyin shu yerga qaytadi). */
  returnPath: string;
  children: ReactNode;
}

export function ProSectionGate({ section, returnPath, children }: ProSectionGateProps) {
  /**
   * `redirect*: false` — foydalanuvchini boshqa sahifaga OTKAZMAYMIZ.
   * Shu sahifaning o'zida tushuntirish ko'rsatilgani yaxshiroq: nima uchun
   * yopiqligi va nima qilish kerakligi darhol ko'rinadi.
   */
  const { hasAccess, loading } = useProAccess({
    redirectGuestsToAuth: false,
    redirectWithoutAccess: false,
  });
  const { backendConfirmed, refresh } = useAccessState();
  const { user } = useAuth();

  /*
    DIQQAT: bu komponent `MainLayout` ni O'ZI chizmaydi — uni chaqiruvchi
    sahifa TASHQARIDAN o'raydi.

    Ilgari uchala holat ham o'z `MainLayout` ini qaytarardi. Natijada holat
    almashganda React eski daraxtni butunlay yo'q qilib, yangisini qurardi:
    footer DOM dan chiqib qayta paydo bo'lardi va sahifa keskin sakrardi
    (CLS 0.68 gacha). Endi layout bir marta o'rnatiladi, faqat ichi almashadi.
  */
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center" role="status">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (hasAccess) return <>{children}</>;

  /**
   * Sabab tartibi MUHIM:
   *   1. mehmon — sessiyasi yo'q, `backendConfirmed` ham false bo'ladi;
   *      unga "server ishlamayapti" deyish chalg'ituvchi bo'lardi
   *   2. server javob bermadi — PRO bo'lganni "obunasiz" deb ayblamaymiz
   *   3. PRO yo'q
   */
  const reason = !user ? "guest" : !backendConfirmed ? "backend" : "no_pro";

  return (
    <ProAccessGate
      section={section}
      reason={reason}
      returnPath={returnPath}
      onRetry={refresh}
    />
  );
}
