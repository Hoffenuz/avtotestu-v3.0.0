import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface IzohBoxProps {
  text?: string | null;
  title?: string;
}

/** Inline izoh bloki (kerak bo'lsa) */
export function IzohBox({ text, title = "Izoh" }: IzohBoxProps) {
  const trimmed = (text || "").trim();
  if (!trimmed) return null;

  return (
    <div className="mt-4 rounded-lg border border-primary/25 bg-primary/[0.04] p-3.5 md:p-4">
      <div className="flex items-center gap-2 mb-1.5 text-primary">
        <BookOpen className="w-4 h-4 shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wide">{title}</span>
      </div>
      <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
        {trimmed}
      </p>
    </div>
  );
}

interface IzohNavButtonProps {
  text?: string | null;
  title?: string;
  emptyText?: string;
  /** Bepul test: izoh o'rniga PRO reklama */
  requirePro?: boolean;
  /** @deprecated html.dark sync orqali kerak emas — moslik uchun qoldirilgan */
  isDark?: boolean;
  /** Modal ochilganda (masalan auto-advance ni to'xtatish) */
  onOpen?: () => void;
  className?: string;
}

/**
 * Pastki chapdagi Izoh tugmasi — sheet pastdan chiqadi.
 * Dizayn: sayt tokenlari (bg-card, border-border, primary...).
 */
export function IzohNavButton({
  text,
  title,
  emptyText,
  requirePro = false,
  onOpen,
  className,
}: IzohNavButtonProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const trimmed = (text || "").trim();
  const sheetTitle = title || t("test.explanation");
  const proTitle = t("test.izohProTitle");
  const proDescription = t("test.izohProDescription");
  const proCta = t("test.izohProCta");
  const bullets = [
    t("test.izohProBullet1"),
    t("test.izohProBullet2"),
    t("test.izohProBullet3"),
  ];

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) onOpen?.();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={() => handleOpenChange(true)}
        className={cn(
          "h-9 md:h-10 px-2.5 sm:px-3.5 gap-1.5 shrink-0 font-medium text-sm",
          "border-primary/70 text-primary bg-background",
          "hover:bg-primary/5 hover:text-primary hover:border-primary",
          className,
        )}
        aria-label={sheetTitle}
      >
        <BookOpen className="w-4 h-4 shrink-0" />
        <span>{sheetTitle}</span>
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className={cn(
            "mx-auto max-w-xl rounded-t-2xl p-0 gap-0",
            "bg-card text-card-foreground border-border",
            "pb-[max(1rem,env(safe-area-inset-bottom))]",
            "data-[state=open]:duration-500 data-[state=closed]:duration-300",
            "[&>button.absolute]:hidden",
          )}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/25" />
          </div>

          <SheetHeader className="relative px-5 pt-2 pb-3 pr-14 text-left border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {requirePro ? <Crown className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
              </div>
              <SheetTitle className="text-lg md:text-xl font-bold text-foreground">
                {requirePro ? proTitle : sheetTitle}
              </SheetTitle>
            </div>
            <SheetDescription className="sr-only">
              {requirePro ? proTitle : sheetTitle}
            </SheetDescription>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="absolute right-3 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </SheetHeader>

          <div className="max-h-[min(58vh,26rem)] overflow-y-auto px-5 py-5 md:px-6 md:py-6">
            {requirePro ? (
              <div className="space-y-5">
                <p className="text-base md:text-lg leading-relaxed text-foreground/90">
                  {proDescription}
                </p>
                <ul className="space-y-2 text-sm md:text-base text-muted-foreground">
                  {bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-primary font-semibold">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/pro" onClick={() => handleOpenChange(false)} className="block">
                  <Button size="lg" className="w-full h-12 text-base font-semibold gap-2">
                    <Crown className="w-5 h-5" />
                    {proCta}
                  </Button>
                </Link>
              </div>
            ) : (
              <p
                className={cn(
                  "text-base md:text-lg leading-relaxed whitespace-pre-wrap",
                  trimmed ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {trimmed || emptyText || t("test.noExplanation")}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
