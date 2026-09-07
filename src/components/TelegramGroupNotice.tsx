/**
 * TelegramGroupNotice — Telegram guruhi haqida BIR MARTALIK xabarnoma.
 *
 * Footer ustida, sahifa oxirida chiqadi. Yopilgach qaytib chiqmaydi.
 *
 * NEGA MODAL EMAS: modal foydalanuvchini majburlab to'xtatadi va u
 * o'qimasdan yopadi. Sahifa oxirida turgan xabarnoma esa ishini
 * tugatgan odamga to'g'ri keladi — aynan o'shanda guruhga qo'shilish
 * mantiqiy.
 *
 * BIR MARTA — QURILMA BO'YICHA: yopilgach, kirish yoki chiqishdan
 * qat'i nazar boshqa chiqmaydi. Ilgari u hisob kaliti bo'yicha
 * tekshirilardi va foydalanuvchi chiqib ketganda kalit mehmon kalitiga
 * almashib, xabarnoma qaytib chiqardi. Bitta qurilmadagi ikkinchi hisob
 * uni ko'rmaydi — bu ataylab: bu baribir o'sha odam, va takror
 * ko'rsatish bezovta qiladi.
 *
 * Xatti-harakat `TelegramGroupNotice.test.tsx` da qulflangan.
 */
import { useEffect, useState } from "react";
import { MessageCircle, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { TELEGRAM_GROUP_URL, groupNoticeKey, GROUP_NOTICE_DEVICE_KEY } from "@/lib/telegram";

/**
 * Xabarnoma allaqachon yopilganmi.
 *
 * IKKALA kalit ham tekshiriladi va ularning BIRORTASI yetarli:
 *
 *   qurilma kaliti — bu brauzerda kimdir yopgan. Kirish/chiqishdan
 *     qat'i nazar ishlaydi, chunki u hisobga bog'liq emas.
 *   hisob kaliti   — aynan shu foydalanuvchi yopgan.
 *
 * Shart "YOKI" ekani muhim: agar faqat hisob kaliti tekshirilsa,
 * foydalanuvchi chiqib ketganda kalit almashib xabarnoma qaytardi.
 *
 * localStorage o'qib bo'lmasa (maxfiy rejim, saytga ma'lumot saqlash
 * o'chirilgan) "yopilgan" deb hisoblanadi — aks holda xabarnomani
 * yopib bo'lmay, u har sahifada qaytaverardi.
 */
function yopilganmi(userId?: string | null): boolean {
  try {
    if (localStorage.getItem(GROUP_NOTICE_DEVICE_KEY) === "1") return true;
    return localStorage.getItem(groupNoticeKey(userId)) === "1";
  } catch {
    return true;
  }
}

export function TelegramGroupNotice() {
  const { t } = useLanguage();
  const { user } = useAuth();
  /*
    Boshlang'ich holat SINXRON hisoblanadi — birinchi bo'yoqdayoq to'g'ri
    bo'lsin. Aks holda xabarnoma keyinroq qo'shilib footer ni surardi
    (qisqa sahifalarda o'lchangan CLS 0.0227).
  */
  const [show, setShow] = useState(() => !yopilganmi());

  /*
    Hisob ma'lum bo'lgach QAYTA baholanadi, lekin FAQAT YASHIRISH
    tomoniga.

    NEGA FAQAT BIR TOMONGA: ilgari bu yerda `setShow(...)` turardi va u
    holatni ikki tomonga o'zgartirardi. Natijada foydalanuvchi hisobida
    xabarnomani yopgach chiqib ketsa, `user?.id` yo'qolib effekt MEHMON
    kalitini o'qirdi — u esa yozilmagan bo'lib, xabarnoma qaytib
    chiqardi. Endi bir marta yashiringan xabarnoma seans davomida hech
    qanday holat o'zgarishida qayta yoqilmaydi.
  */
  useEffect(() => {
    if (yopilganmi(user?.id)) setShow(false);
  }, [user?.id]);

  const yop = () => {
    setShow(false);
    try {
      // Qurilma kaliti — asosiy: kirish/chiqishdan qat'i nazar ushlab turadi.
      localStorage.setItem(GROUP_NOTICE_DEVICE_KEY, "1");
      // Hisob kaliti — qo'shimcha; kelajakda bazaga ko'chirilsa asqotadi.
      localStorage.setItem(groupNoticeKey(user?.id), "1");
    } catch { /* kvota yoki maxfiy rejim */ }
  };

  if (!show) return null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-6">
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/40 bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent p-4 sm:p-5">
        <button
          type="button"
          onClick={yop}
          aria-label={t("tgGroup.close")}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-8 sm:gap-4">
          <span
            className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-sky-500 shadow-sm"
            aria-hidden="true"
          >
            <MessageCircle className="h-5 w-5 text-white" />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-foreground">
              {t("tgGroup.title")}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("tgGroup.desc")}
            </p>

            <a
              href={TELEGRAM_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={yop}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
            >
              {t("tgGroup.join")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TelegramGroupNotice;
