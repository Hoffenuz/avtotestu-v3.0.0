import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import guides from "@/data/seo/guides.json";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { buildLangPath } from "@/lib/langUrl";

/*
  Sahifa ostidagi tushuntirish matni va "ko'p so'raladigan savollar".

  NEGA BU YERDA: Google'ga `/belgilar` va `/test-ishlash` uchun botlarga
  alohida statik nusxa beriladi (`scripts/generate-main-pages.cjs`). Nusxa
  va haqiqiy sahifa BIR XIL matnni ko'rsatishi shart, aks holda Google
  buni "foydalanuvchiga boshqa narsa ko'rsatish" deb hisoblaydi. Shuning
  uchun matn bitta faylda (`src/data/seo/guides.json`) turadi va ikkala
  tomon ham uni o'sha yerdan oladi — qo'lda ikki joyda yozilmaydi.
*/

export type GuidePage = "belgilar" | "testIshlash";

interface GuideSection {
  title: string;
  paragraphs?: string[];
  list?: { name: string; text: string }[];
  bullets?: string[];
}

interface Guide {
  sections: GuideSection[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  linksTitle: string;
  links: { href: string; label: string }[];
}

const GUIDES = guides as unknown as Record<GuidePage, Record<Language, Guide>>;

interface SeoGuideProps {
  page: GuidePage;
  /** Matndagi `{count}`, `{groups}` kabi o'rinlar uchun qiymatlar. */
  vars?: Record<string, string | number>;
  className?: string;
}

export function SeoGuide({ page, vars, className = "" }: SeoGuideProps) {
  const { language } = useLanguage();
  const guide = GUIDES[page]?.[language] ?? GUIDES[page]?.["uz-lat"];
  if (!guide) return null;

  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? ""));

  return (
    <section
      className={`rounded-3xl border border-border bg-card p-5 sm:p-8 text-[15px] leading-relaxed text-foreground/90 ${className}`}
    >
      <div className="flex flex-col gap-8">
        {guide.sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">{section.title}</h2>

            {section.paragraphs?.map((p) => (
              <p key={p} className="mb-3 last:mb-0">
                {fill(p)}
              </p>
            ))}

            {section.list && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {section.list.map((item) => (
                  <div key={item.name} className="rounded-2xl bg-muted/60 p-4">
                    <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
                    <p className="text-muted-foreground">{fill(item.text)}</p>
                  </div>
                ))}
              </div>
            )}

            {section.bullets && (
              <ul className="list-disc pl-5 space-y-2">
                {section.bullets.map((b) => (
                  <li key={b}>{fill(b)}</li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">{guide.faqTitle}</h2>
          <div className="flex flex-col gap-2">
            {guide.faq.map((item) => (
              <details key={item.q} className="group rounded-xl border border-border bg-background px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  <span>{fill(item.q)}</span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-2 text-muted-foreground">{fill(item.a)}</p>
              </details>
            ))}
          </div>
        </div>

        <nav aria-label={guide.linksTitle}>
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">{guide.linksTitle}</h2>
          <ul className="flex flex-wrap gap-2">
            {guide.links.map((l) => (
              <li key={l.href}>
                <Link
                  to={buildLangPath(language, l.href)}
                  className="inline-block rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}

export default SeoGuide;
