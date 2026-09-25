// ============================================================================
// PageIntro — katalog sahifasining sarlavha tasmasi (hozir /bolimlar)
// ----------------------------------------------------------------------------
// Siyoh ikonka qutisi + ixcham h1 + bitta qator izoh, fonda bosh sahifa
// hero'sidagi ingichka katak. Test boshlash sahifalari (/test-ishlash,
// /variant, /mavzuli) o'z tanish maketida qoldi — ularga qo'llanmaydi.
//
// IXCHAM ATAYLAB: sarlavha sahifaning maqsadini aytadi, xolos — asosiy
// narsa (plitkalar, variantlar, tugma) birinchi ekranda ko'rinishi kerak.
// Ilgari /bolimlar da 32px sarlavha va keng bo'shliq plitkalarni pastga
// surib yuborardi.
//
// Balandlik ekran o'lchamiga (vh) bog'lanmagan — kichraytirish/kattalashtirish
// (brauzer zoom) va har qanday ekranda bir xil nisbatda turadi.
// ============================================================================

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageIntroProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Kontent kengligi bilan bir xil bo'lsin (masalan `max-w-4xl`). */
  width?: string;
  /** Ikonka uchun qo'shimcha sinf (masalan Play uchun `fill-current`). */
  iconClassName?: string;
}

export function PageIntro({ icon: Icon, title, subtitle, width = "max-w-6xl", iconClassName }: PageIntroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:44px_44px] opacity-60 [mask-image:linear-gradient(to_bottom,#000,transparent)]"
      />
      <div className={cn("relative mx-auto flex w-full items-center gap-3.5 px-4 py-4 md:gap-4 md:px-6 md:py-5", width)}>
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/25 md:h-12 md:w-12"
        >
          <Icon className={cn("h-5 w-5 md:h-[22px] md:w-[22px]", iconClassName)} />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-tight tracking-tight text-brand dark:text-foreground md:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground md:text-[15px]">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
