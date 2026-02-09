import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

export function SiteNotificationBanner() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 z-50 animate-in slide-in-from-left-4 fade-in duration-300 max-w-[calc(100vw-2rem)] sm:max-w-sm">
      <a
        href="https://maktabavto.uz"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-card border border-border shadow-lg rounded-xl p-3 pr-10 hover:bg-secondary/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm text-foreground leading-snug">
            Saytning avvalgi versiyasi{" "}
            <span className="text-primary font-medium group-hover:underline">
              maktabavto.uz
            </span>{" "}
            saytida mavjud
          </p>
        </div>
      </a>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(false);
        }}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
        aria-label="Yopish"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
