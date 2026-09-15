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
      <div className="w-full bg-emerald-600 text-white rounded-none px-2 py-2 flex items-center justify-between gap-2">
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 2L20 12L3 22V2Z" />
        </svg>

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
        <div className="flex-1 min-w-0 px-1">
          <div className="font-semibold text-sm leading-tight truncate">
            AvtoSmart — mobil ilova
          </div>
        </div>

        <img
          src="/images/rasm32.webp"
          alt="Google Play"
          className="w-28 h-10 object-contain flex-shrink-0"
          loading="lazy"
        />
      </div>
    </a>
  );
}

export default MobileAppBanner;
