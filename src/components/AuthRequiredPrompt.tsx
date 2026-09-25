// ============================================================================
// AuthRequiredPrompt — "bu bo'lim uchun hisob kerak" matni va tugmasi
// ----------------------------------------------------------------------------
// Xato savollarim / saqlanganlar, Real imtihon, Xatolar ustida ishlash —
// kirmagan foydalanuvchiga shu blok ko'rsatiladi.
//
// Yangi qurilmada (hech qachon kirilmagan) — "bepul ro'yxatdan o'ting" va
// "Ro'yxatdan o'tish" tugmasi; /auth ham shu tabda ochiladi (`authEntry`).
// Avval kirilgan qurilmada — avvalgidek "Kirish". Ikkala holatda ham hisob
// ochilgach/kirilgach foydalanuvchi SHU sahifaga qaytadi.
// ============================================================================

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { authState, defaultAuthMode } from "@/lib/authEntry";

export function AuthRequiredPrompt({ textClassName = "text-muted-foreground" }: { textClassName?: string }) {
  const { t } = useLanguage();
  const location = useLocation();
  // Birinchi renderda bir marta — keyin o'zgarmaydi (matn sakramasin).
  const [mode] = useState(defaultAuthMode);
  const isNew = mode === "signup";

  return (
    <>
      <p className={textClassName}>{t(isNew ? "pages.signUpRequired" : "pages.signInRequired")}</p>
      <Button asChild className="mt-4">
        <Link to="/auth" state={authState(location.pathname + location.search)}>
          {isNew ? t("auth.tabSignup") : t("pages.signIn")}
        </Link>
      </Button>
    </>
  );
}
