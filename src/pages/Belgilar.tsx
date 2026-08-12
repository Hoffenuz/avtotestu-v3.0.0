import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocalizedText {
  uz_lat: string;
  uz_cyr: string;
  ru: string;
}

interface SignItem {
  src: string;
  code: string | null;
  title: LocalizedText;
}

interface SignGroup {
  title: LocalizedText;
  items: SignItem[];
}

type ContentLang = "uz_lat" | "uz_cyr" | "ru";

function contentLangFromApp(language: "uz-lat" | "uz" | "ru"): ContentLang {
  if (language === "uz-lat") return "uz_lat";
  if (language === "uz") return "uz_cyr";
  return "ru";
}

function pickText(text: LocalizedText, lang: ContentLang): string {
  return text[lang] || text.uz_lat || text.uz_cyr || text.ru || "";
}

export default function Belgilar() {
  const { language, t } = useLanguage();
  const contentLang = contentLangFromApp(language);

  const [groups, setGroups] = useState<SignGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    open: boolean;
    src: string;
    title: LocalizedText | null;
  }>({
    open: false,
    src: "",
    title: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const modalTitle = modal.title ? pickText(modal.title, contentLang) : "";

  useEffect(() => {
    let cancelled = false;

    async function loadSigns() {
      /**
       * Timeout SHART: ilgari bu yagona timeout siz JSON so'rovi edi (qolgani
       * fetchQuestionJson orqali himoyalangan). Sekin/uzilgan tarmoqda fetch
       * hech qachon tugamasdi — `finally` ishlamay, `loading` abadiy true
       * qolardi va /belgilar sahifasi cheksiz aylanardi.
       */
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      try {
        const res = await fetch("/data/belgilar.json", { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as SignGroup[];
        if (!cancelled) setGroups(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!import.meta.env.PROD) console.error("Error loading signs:", err);
        if (!cancelled) setGroups([]);
      } finally {
        clearTimeout(timer);
        if (!cancelled) setLoading(false);
      }
    }

    loadSigns();
    return () => {
      cancelled = true;
    };
  }, []);

  const localizedGroups = useMemo(
    () =>
      groups.map((group) => ({
        title: pickText(group.title, contentLang),
        items: group.items.map((item) => ({
          src: item.src,
          title: pickText(item.title, contentLang),
          titleI18n: item.title,
          searchBlob: `${item.title.uz_lat} ${item.title.uz_cyr} ${item.title.ru}`.toLowerCase(),
        })),
      })),
    [groups, contentLang]
  );

  const filteredGroups = localizedGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.searchBlob.includes(q);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const totalSigns = groups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <MainLayout>
      <SEO
        title={t("belgilar.seoTitle")}
        description={t("belgilar.seoDescription")}
        path="/belgilar"
        keywords={t("belgilar.seoKeywords")}
      />
      <section className="bg-gradient-to-br from-primary to-primary-hover py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3">
            {t("belgilar.title")}
          </h1>
          <p className="text-base text-primary-foreground/90 mb-6">
            {t("belgilar.subtitle").replace("{count}", String(totalSigns))}
          </p>

          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("belgilar.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-5 text-base rounded-xl bg-primary-foreground border-none shadow-lg"
            />
          </div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-12">
              {filteredGroups.map((group, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                      {group.title}
                    </h2>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {t("belgilar.countLabel").replace("{count}", String(group.items.length))}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3">
                    {group.items.map((item, i) => (
                      <Card
                        key={i}
                        className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                        onClick={() =>
                          setModal({ open: true, src: item.src, title: item.titleI18n })
                        }
                      >
                        <CardContent className="p-0">
                          <div className="aspect-square bg-secondary/30 flex items-center justify-center p-3">
                            <img
                              src={item.src}
                              alt={item.title}
                              className="max-w-full max-h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-2 text-center">
                            <p className="text-[10px] md:text-xs text-foreground line-clamp-2">
                              {item.title}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              {filteredGroups.length === 0 && !loading && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">
                    {t("belgilar.notFound").replace("{query}", searchQuery)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {modal.open && (
        <div
          className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal({ open: false, src: "", title: null });
          }}
        >
          <div className="bg-card rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="relative bg-secondary/50 p-8 flex items-center justify-center">
              <button
                onClick={() => setModal({ open: false, src: "", title: null })}
                className="absolute top-4 right-4 w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={modal.src}
                alt={modalTitle}
                className="max-h-[50vh] object-contain"
              />
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-semibold text-foreground">{modalTitle}</h3>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
