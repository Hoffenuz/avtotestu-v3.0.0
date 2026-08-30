// ============================================================================
// SaveQuestionButton — savolni saqlash / saqlanganini bekor qilish
// ----------------------------------------------------------------------------
// Test paytida savol yonida turadi. Saqlangan savollar `/saqlangan`
// sahifasida ko'rinadi.
//
// HOLAT QAYERDAN OLINADI:
//   Umumiy to'plamdan (`questionState.ts`), sessiyada bir marta yuklanadi.
//
//   ILGARI XATO BOR EDI: har bir tugma `useState(false)` bilan boshlanardi
//   va holat serverdan hech qachon o'qilmasdi. Foydalanuvchi saqlagan
//   savoliga qaytsa, tugma "saqlanmagan" ko'rinardi va yana bosilganda
//   RPC toggle qilib, saqlangani O'CHIB KETARDI.
//
// QOLGAN QARORLAR:
//   * Kirmagan foydalanuvchiga umuman ko'rsatilmaydi — bosgach "kiring"
//     degan xabar chiqarish ortiqcha to'siq, tugma yo'qligi tinchroq.
//   * `globalId` bo'lmasa ham ko'rsatilmaydi (eski formatdagi savollar).
// ============================================================================

import { useEffect, useSyncExternalStore } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ensureSavedSet,
  isSavedLocal,
  subscribeSaved,
  toggleSavedQuestion,
} from "@/lib/questionState";
import { cn } from "@/lib/utils";

interface SaveQuestionButtonProps {
  globalId?: string;
  className?: string;
}

export function SaveQuestionButton({ globalId, className }: SaveQuestionButtonProps) {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Ro'yxatni bir marta yuklaymiz (takroriy chaqiruvlar bitta so'rovni kutadi)
  useEffect(() => {
    if (user) void ensureSavedSet();
  }, [user]);

  const saved = useSyncExternalStore(
    subscribeSaved,
    () => (globalId ? isSavedLocal(globalId) : false),
    () => false,
  );

  if (!user || !globalId) return null;

  const handleClick = async () => {
    // Server javobi `questionState` dagi umumiy to'plamni yangilaydi,
    // shu sababli bu yerda alohida holat saqlash shart emas.
    await toggleSavedQuestion(globalId);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => void handleClick()}
      aria-pressed={saved}
      aria-label={saved ? t("pages.unsaveQuestion") : t("pages.saveQuestion")}
      title={saved ? t("pages.savedShort") : t("pages.saveShort")}
      className={cn("shrink-0", saved && "text-primary", className)}
    >
      {saved ? (
        <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Bookmark className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}
