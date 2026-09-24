// ============================================================================
// SectionGrid — bo'lim plitkalari
// ----------------------------------------------------------------------------
// DIZAYN QARORLARI:
//   * Ixcham plitka: rangli ikonka + qisqa nom. Uzun tavsifli katta
//     kartochkalarni ko'z ketma-ket o'qishga majbur bo'ladi, ixchamlarini
//     esa bir qarashda skanerlaydi.
//   * Har bir plitka o'z rangida — bir xil rangli to'r bir tekis "devor"
//     bo'lib ko'rinadi va elementlar ajralmaydi.
//   * Kirish talab qiladigan bo'limlar kirmagan foydalanuvchiga ham
//     ko'rsatiladi, lekin QULF belgisi bilan. Yashirish "sayt kambag'al"
//     degan taassurot qoldirardi.
//
// DARK MODE: faqat tema tokenlari (`bg-card`, `text-foreground`, `border-border`).
// ============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Crown, Lock } from "lucide-react";
import { ACCENT_CLASS, ACCENT_EDGE_CLASS, type SectionGroup, type SectionItem } from "@/lib/siteSections";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { hasStoredSession } from "@/lib/hasStoredSession";
import { cn } from "@/lib/utils";

interface SectionGridProps {
  items: readonly SectionItem[];
  /** Bo'lim yonidagi son (masalan xato javoblar soni). */
  badges?: Record<string, number>;
  /** Kirish talab qiladigan bo'limlarda qulf ko'rsatiladimi. */
  signedIn?: boolean;
  /**
   * Nom ostida qisqa tavsif ko'rsatiladimi va plitka kattaroq bo'ladimi.
   *
   * `/bolimlar` uchun `true`: u ro'yxatning O'ZI bo'lgan sahifa, plitkalar
   * bo'sh joyni to'ldirishi va nima ish qilishini aytib turishi kerak.
   * Bosh sahifadagi tezkor plitkalar uchun `false` — u yerda ular sahifaning
   * kichik bir qismi, tavsif esa e'tiborni bo'lardi.
   */
  showDescription?: boolean;
}

export function SectionGrid({
  items,
  badges,
  signedIn = true,
  showDescription = false,
}: SectionGridProps) {
  const { t } = useLanguage();
  const { isPremium, backendConfirmed } = useAccessState();

  /**
   * PRO belgisi qachon chizilishi mumkin.
   *
   * Muammo: PRO foydalanuvchi sahifani ochganda `isPremium` bir lahza `false`
   * bo'lib turadi (RPC hali javob bermagan) va u O'ZI SOTIB OLGAN bo'limlarda
   * "PRO" qulfini ko'radi — keyin belgi g'oyib bo'ladi. Bu "yaltillash" pullik
   * mijozga "obunam ishlamayaptimi?" degan shubha beradi.
   *
   * Yechim `Home.tsx` dagi bilan bir xil: saqlangan sessiya BOR bo'lsa,
   * serverdan tasdiq kelguncha belgi chizilmaydi. Mehmonda (saqlangan sessiya
   * yo'q) kutish umuman yo'q — belgi darhol ko'rinadi, chunki mehmon hech
   * qachon PRO bo'lmaydi.
   */
  const [expectsSession] = useState(hasStoredSession);
  const proBadgeReady = backendConfirmed || !expectsSession;

  /**
   * Plitka o'ng chetidagi belgi: PRO / qulf / son.
   *
   * PRO belgisi qulfdan OLDIN: kirmagan foydalanuvchi uchun ham muhimrog'i
   * bo'lim pullik ekani, kirish esa ikkinchi shart.
   */
  const marker = (item: SectionItem, locked: boolean, badge?: number) => {
    if (item.requiresPro && !isPremium && proBadgeReady) {
      return (
        <span
          className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400"
          title={t("sections.proOnly")}
        >
          <Crown className="h-3 w-3" aria-hidden="true" />
          PRO
        </span>
      );
    }
    if (locked) {
      return <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label={t("sections.locked")} />;
    }
    if (badge) {
      return (
        <span
          className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground"
          aria-label={`${badge} ta`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      );
    }
    return null;
  };

  /*
    IKKI KO'RINISH, ikki vazifa:

    `showDescription` (= /bolimlar) — YONMA-YON qator: ikonka, nom, tavsif
    bir chiziqda. Ro'yxatni tez skanerlash uchun eng zich shakl.

    Aksi (= bosh sahifadagi uchta tezkor plitka) — TIK kartochka. Ilgari u
    ham qator edi va uchta ustunga siqilganda nom joyga sig'may kesilardi
    ("Real imtihon ...", "Xatol...") — chunki bitta qatorda ikonka, nom,
    PRO belgisi va strelka o'zaro joy talashardi. Tik ko'rinishda nom
    BUTUN kenglikni oladi, kesilmaydi va ikki qatorga o'tsa ham buziladi.
  */
  if (!showDescription) {
    /**
   * Burchakdagi belgi — ixcham plitkalar uchun.
   *
   * `marker()` dan farqi: fon TO'LIQ, shaffof emas. Belgi plitkadan
   * tashqariga chiqib turadi, ya'ni ortida sahifa foni bo'ladi — shaffof
   * amber (`bg-amber-500/15`) u yerda deyarli ko'rinmasdi.
   *
   * Ko'rinish bosh sahifadagi hero tugmalarining PRO nishonchasi bilan
   * ataylab bir xil: bir sahifada ikki xil PRO belgisi bo'lmasin.
   */
  const cornerMarker = (item: SectionItem, locked: boolean, badge?: number) => {
    if (item.requiresPro && !isPremium && proBadgeReady) {
      return (
        <span
          className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 text-[11px] font-bold text-amber-950 shadow-sm"
          title={t("sections.proOnly")}
        >
          <Crown className="h-3 w-3" aria-hidden="true" />
          PRO
        </span>
      );
    }
    if (locked) {
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted shadow-sm">
          <Lock className="h-3 w-3 text-muted-foreground" aria-label={t("sections.locked")} />
        </span>
      );
    }
    if (badge) {
      return (
        <span
          className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow-sm"
          aria-label={`${badge} ta`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      );
    }
    return null;
  };

  /*
      IXCHAM QATOR — bosh sahifadagi uchta tezkor plitka.

      O'lchamlar ASLIDAGICHA: bu plitkalar bosh sahifaning kichik bir qismi,
      uning asosiy mazmuni emas — kattalashtirilsa hero tugmalari bilan
      e'tibor talashib qolardi. Shuning uchun tavsif ham, chaqiruv qatori
      ham yo'q: faqat ikonka va nom.

      NOM ENDI KESILMAYDI. Ilgari bu yerda `truncate` turardi va uch ustunga
      siqilganda nomlar "Xatol…", "Qiyin …" bo'lib qirqilardi. Ikki o'zgarish
      buni to'liq hal qiladi:
        1. `truncate` o'rniga oddiy o'ralish — uzun nom ikkinchi qatorga
           tushadi. Qator balandligi ikonka bilan belgilanadi, ya'ni ikki
           qatorli nom ham plitkani UZAYTIRMAYDI.
        2. PRO / qulf belgisi BURCHAKKA ko'chdi. Aynan u nomdan ~60px joy
           o'g'irlardi: uchta ustunda nomga bor-yo'g'i ~95px qolardi va
           hech qanday shrift unga sig'masdi. Burchakda esa u umuman joy
           egallamaydi — bu bosh sahifadagi hero tugmalarining PRO
           nishonchasi bilan ham bir xil ko'rinish.

      RAMKA PLITKANING O'Z RANGIDA: avval hammasi bir xil kulrang edi va
      sahifadagi boshqa oq kartochkalardan ajralmasdi. Yangi bo'yoq
      qo'shilmadi — rang allaqachon ikonkada bor.
    */
    return (
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const locked = Boolean(item.requiresAuth) && !signedIn;
          const corner = cornerMarker(item, locked, badges?.[item.to]);

          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  // `relative` — burchakdagi belgi SHU elementga nisbatan
                  // joylashsin. Belgi `li` da emas, aynan shu yerda turishi
                  // kerak: aks holda sichqoncha tekkanda kartochka
                  // ko'tarilardi-yu, belgi joyida qolib ketardi.
                  "group relative flex h-full items-center gap-3.5 rounded-xl border bg-card px-4 py-4",
                  "transition-all hover:-translate-y-0.5 hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "sm:px-5 sm:py-5",
                  ACCENT_EDGE_CLASS[item.accent],
                )}
              >
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14",
                    ACCENT_CLASS[item.accent],
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>

                <span className="min-w-0 flex-1 text-base font-bold leading-snug text-foreground sm:text-lg">
                  {t(item.titleKey)}
                </span>

                <ChevronRight
                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />

                {corner ? <span className="absolute -right-1.5 -top-1.5">{corner}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3.5">
      {items.map((item) => {
        const Icon = item.icon;
        const locked = Boolean(item.requiresAuth) && !signedIn;

        return (
          <li key={item.to}>
            <Link
              to={item.to}
              className={cn(
                "group flex h-full items-center gap-4 rounded-xl border border-border bg-card px-4 py-4",
                "transition-all",
                "hover:border-primary/40 hover:bg-accent hover:shadow-md hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "sm:px-5 sm:py-5",
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12",
                  ACCENT_CLASS[item.accent],
                )}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-foreground sm:text-base">
                  {t(item.titleKey)}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground sm:text-[13px]">
                  {t(item.descKey)}
                </span>
              </span>

              {marker(item, locked, badges?.[item.to])}

              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Guruh sarlavhalari bilan chizilgan katalog.
 *
 * NEGA SARLAVHA KERAK: `/bolimlar` da endi 13 ta plitka bor. Yassi ro'yxatda
 * ular bir tekis "devor" bo'lib ko'rinadi va ko'z har bittasini alohida
 * o'qib chiqishga majbur bo'ladi. Sarlavha ro'yxatni uchta MAQSADGA bo'ladi
 * — foydalanuvchi avval maqsadini tanlaydi, keyin ichidan 4-5 tasini ko'radi.
 *
 * Sarlavhalar `h2` — sahifada bitta `h1` (sahifa nomi) bo'ladi, guruhlar esa
 * uning ostidagi bo'limlar. Bu ekran o'quvchilarga ham to'g'ri tuzilma beradi.
 */
export function SectionGroupList({
  groups,
  badges,
  signedIn = true,
}: {
  groups: readonly SectionGroup[];
  badges?: Record<string, number>;
  signedIn?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-7 md:space-y-9">
      {groups.map((group) => (
        <section key={group.titleKey}>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:mb-3.5 md:text-[13px]">
            {t(group.titleKey)}
          </h2>
          <SectionGrid items={group.items} badges={badges} signedIn={signedIn} showDescription />
        </section>
      ))}
    </div>
  );
}
