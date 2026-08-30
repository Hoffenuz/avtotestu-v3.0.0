// ============================================================================
// ProfileSection — profil sahifasidagi yig'iladigan bo'lim
// ----------------------------------------------------------------------------
// NEGA YIG'ILADIGAN:
//   Profil sahifasi hamma narsani bir vaqtda ochiq ko'rsatardi — parol
//   o'zgartirish, litsenziya, natijalar tarixi va sozlamalar bir ustunda
//   uzun tasma bo'lib cho'zilardi. Foydalanuvchi kerakli bandni topguncha
//   ekranni bir necha marta suradi.
//
//   Endi har bir bo'lim BITTA QATOR: rangli ikonka + nom + o'ng tomonda
//   qisqa qiymat. Bosilganda ochiladi. Bu mobil ilovalardagi tanish naqsh.
//
// OCHIQLIK HOLATI ESLAB QOLINADI (`storageKey` berilsa): foydalanuvchi
// doim ochadigan bo'limni har safar qayta ochishga majbur bo'lmaydi.
// ============================================================================

import { useCallback, useId, useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Ikonka foni — statik Tailwind sinflari (dinamik yasalgani build'da topilmaydi). */
export type SectionTone = "indigo" | "emerald" | "amber" | "sky" | "rose" | "violet";

const TONE_CLASS: Record<SectionTone, string> = {
  indigo: "bg-indigo-500/10 text-indigo-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  sky: "bg-sky-500/10 text-sky-500",
  rose: "bg-rose-500/10 text-rose-500",
  violet: "bg-violet-500/10 text-violet-500",
};

interface ProfileSectionProps {
  icon: LucideIcon;
  title: string;
  /** O'ng tomondagi qisqa qiymat (masalan "PRO", "12 ta"). */
  value?: string;
  tone?: SectionTone;
  /** Boshlanishida ochiqmi. */
  defaultOpen?: boolean;
  /** Berilsa, ochiqlik holati shu kalit bilan eslab qolinadi. */
  storageKey?: string;
  children: React.ReactNode;
}

function readStored(key: string | undefined, fallback: boolean): boolean {
  if (!key) return fallback;
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
}

export function ProfileSection({
  icon: Icon,
  title,
  value,
  tone = "indigo",
  defaultOpen = false,
  storageKey,
  children,
}: ProfileSectionProps) {
  const [open, setOpen] = useState(() => readStored(storageKey, defaultOpen));
  const panelId = useId();

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, next ? "1" : "0");
        } catch {
          /* private rejim — holat shunchaki eslab qolinmaydi */
        }
      }
      return next;
    });
  }, [storageKey]);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <h2>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60"
        >
          <span
            className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", TONE_CLASS[tone])}
            aria-hidden="true"
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>

          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">
            {title}
          </span>

          {value ? (
            <span className="shrink-0 text-sm text-muted-foreground">{value}</span>
          ) : null}

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </h2>

      {/*
        Yopiq bo'lganda ichi UMUMAN chizilmaydi (shunchaki yashirilmaydi):
        profilda og'ir bo'limlar bor (natijalar tarixi, litsenziya kartasi)
        va ular bekorga render bo'lmasligi kerak.
      */}
      {open ? (
        <div id={panelId} className="border-t border-border px-4 py-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}
