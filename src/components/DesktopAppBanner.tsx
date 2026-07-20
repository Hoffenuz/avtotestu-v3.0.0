import { useState } from "react";
import { Link } from "react-router-dom";
import { Monitor, ChevronRight, X, WifiOff } from "lucide-react";

const STORAGE_KEY = "desktop-app-banner-dismissed";

/** Faqat kompyuter (md+) ekranlarda — mobil banner bilan aralashmasin */
export function DesktopAppBanner() {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "true";
    } catch {
      return true;
    }
  });

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="hidden md:block relative z-10 bg-emerald-50/70 backdrop-blur-md border-b border-emerald-200/40">
      <div className="flex items-center gap-1 px-2 lg:px-3 py-1.5 max-w-7xl mx-auto">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Bannerni yopish"
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/80 border border-emerald-200/80 hover:border-emerald-300 bg-white/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <Link
          to="/desktop"
          className="flex-1 min-w-0 group rounded-lg hover:bg-white/60 transition-colors px-1.5 py-0.5"
          aria-label="Kompyuter ilovasini yuklab olish"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 border border-emerald-100">
                <Monitor className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground leading-tight">
                  Kompyuter ilovasini yuklab oling
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-px flex items-center gap-1">
                  <WifiOff className="w-2.5 h-2.5 shrink-0 text-emerald-600/70" />
                  Windows — internetsiz test
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-100 px-3 py-1.5 rounded-full shrink-0 shadow-sm group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors">
              Batafsil
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default DesktopAppBanner;
