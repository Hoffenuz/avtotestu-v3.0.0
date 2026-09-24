import { Play } from "lucide-react";

export function MobileAppBanner() {
  return (
    <a
      href="https://play.google.com/store/apps/details?id=com.hoffenuz.Avtotestu&pcampaignid=web_share"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="AvtoSmart — Google Play"
      className="md:hidden block w-full"
    >
      {/*
        Bosh sahifa redizayni (2026-09): ilgari yorqin yashil (`emerald-600`)
        tasma edi — siyoh header ostida ikkinchi "baqiruvchi" rang bo'lib,
        hero'dagi asosiy "Test ishlash" tugmasidan e'tiborni tortardi. Endi
        neytral tasma, siyoh belgi; Google Play belgisi o'zi tanish.
        Ichki bo'shliq (`px-4`) sahifa chekkasi bilan bir xil.
      */}
      <div className="flex w-full items-center justify-between gap-2.5 border-b border-border bg-card px-4 py-2 text-foreground">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-white" aria-hidden="true">
          <Play className="h-4 w-4 fill-current" />
        </span>

        {/*
          MATN ATAYLAB QISQA — bitta qator.

          Avval ikki qatorli uzun matn ("Yangi savollarni offline ishlang")
          bor edi: tor telefonlarda u ikki-uch qatorga bo'linib, banner
          cho'zilib ketardi va Google Play tugmasini siqib qo'yardi.
          Ilova nomi va "mobil ilova" ekani — kerakli ma'lumotning hammasi.

          DIQQAT: bu nom Play Market'dagi ilova nomi bilan BIR XIL bo'lishi
          shart. Do'kondagi nom hozir "Avtodars" — u AvtoSmart ga
          o'zgartirilgach bu matn to'liq to'g'ri bo'ladi.
        */}
        {/*
          O'LCHAM QURILMAGA MOSLASHADI, matn kesilmaydi.

          `truncate` OLIB TASHLANDI: tor telefonda u nomni "AvtoSmart —
          mobil..." qilib kesardi. Endi matn kerak bo'lsa ikki qatorga
          o'tadi (`leading-snug` — harf dumlari kesilmasin uchun), Google
          Play tugmasi esa kichik ekranda ozroq kichrayadi va joy ochadi.
        */}
        <div className="flex-1 min-w-0 px-1">
          <div className="font-semibold text-sm leading-snug sm:text-[15px]">
            AvtoSmart — mobil ilova
          </div>
        </div>

        <img
          src="/images/rasm32.webp"
          alt="Google Play"
          className="w-24 h-9 sm:w-28 sm:h-10 object-contain flex-shrink-0"
          loading="lazy"
        />
      </div>
    </a>
  );
}

export default MobileAppBanner;
