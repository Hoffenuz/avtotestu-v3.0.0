// ============================================================================
// Qidirish — savollar ichidan matn bo'yicha qidirish
// ----------------------------------------------------------------------------
// QAMROV VA PRO:
//   Qidiruv HAR DOIM to'liq korpusdan (1250 savol) boradi — bepul foydalanuvchi
//   ham hamma savolni TOPADI. PRO savollarining matni esa yopiq turadi va
//   o'rniga "PRO olish" taklifi chiqadi.
//
//   Nega shunday: bepul foydalanuvchi 1000 tadan qidirsa, qolgan 250 tasi
//   "topilmadi" bo'lib chiqardi va SABABI ko'rinmasdi — bu chalkash. Endi
//   savol borligi ko'rinadi, lekin ochish uchun PRO kerak.
//
// NEGA KLIENTDA QIDIRAMIZ:
//   Korpus allaqachon yuklanadi va CDN da 24 soat keshlanadi. Serverga
//   qidiruv so'rovi yuborish faqat kechikish qo'shardi.
//
// USTUNLAR SONI:
//   Natijalar BITTA ustunda. Savollar uzun matnli va ko'pincha rasmli —
//   ikki ustunda qator balandliklari tengsiz bo'lib "sakrab" ketadi va
//   o'qish tartibi buziladi. Uzun matn uchun bitta ustun standart yechim.
// ============================================================================

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Lock, Search, X } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProSectionGate } from "@/components/ProSectionGate";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ImageLightbox";
import { QuestionReviewCard } from "@/components/QuestionReviewCard";
import { SaveQuestionButton } from "@/components/SaveQuestionButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { loadCorpusIndex } from "@/lib/questionCorpus";
import { loadFreeQuestionIds } from "@/lib/freeQuestions";
import { transformRawToQuestions, type AppQuestion } from "@/lib/questionTransform";

/** Bir marta ko'rsatiladigan maksimal natija — uzun ro'yxat sahifani sekinlashtiradi. */
const MAX_RESULTS = 40;
/** Shundan qisqa so'rovda qidirilmaydi — deyarli hamma savol mos kelardi. */
const MIN_QUERY = 3;

export default function Qidirish() {
  const { t, questionLang } = useLanguage();
  const { isPremium } = useAccessState();

  const [all, setAll] = useState<AppQuestion[]>([]);
  const [freeIds, setFreeIds] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Yozayotganda har bosishda 1250 ta savolni filtrlash sahifani qotirardi
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const corpusLang = questionLang === "oz" ? "uz-lat" : questionLang;
      // `true` — qidiruvda DOIM to'liq korpus (PRO savollari qulf bilan ko'rsatiladi)
      const [index, free] = await Promise.all([
        loadCorpusIndex(corpusLang, true),
        loadFreeQuestionIds(),
      ]);
      if (cancelled) return;
      setAll(transformRawToQuestions([...index.values()], questionLang, "/images/"));
      setFreeIds(free);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [questionLang]);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (q.length < MIN_QUERY) return [];
    const out: AppQuestion[] = [];
    for (const question of all) {
      const haystack =
        question.text.toLowerCase() +
        " " +
        question.answers.map((a) => a.text).join(" ").toLowerCase();
      if (haystack.includes(q)) {
        out.push(question);
        if (out.length >= MAX_RESULTS) break;
      }
    }
    return out;
  }, [all, deferredQuery]);

  /**
   * Savol PRO tarifidami.
   *
   * Ro'yxat yuklanmagan YOKI bo'sh bo'lsa — HECH NARSA qulflanmaydi.
   * Bo'sh to'plamni "hech narsa bepul emas" deb tushunish butun qidiruvni
   * qulflab qo'yardi, holbuki bu shunchaki tarmoq xatosi bo'lishi mumkin.
   */
  const isLocked = (globalId?: string): boolean => {
    if (isPremium || !globalId) return false;
    if (!freeIds || freeIds.size === 0) return false;
    return !freeIds.has(globalId);
  };

  const trimmed = query.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY;

  return (
    <ProSectionGate section="qidirish" returnPath="/qidirish">
      <MainLayout>
      <SEO
        title="Savol qidirish — YHQ testlari"
        description="1250 ta YHQ savoli ichidan matn bo'yicha qidiring: savol matni yoki javob varianti bo'yicha."
        path="/qidirish"
        keywords="savol qidirish, YHQ savollari, test qidiruv"
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
        <PageHeader
          title={t("sections.qidirish")}
          description={loading ? undefined : `${all.length} ${t("pages.searchIn")}`}
        />

        <div className="relative mb-5">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("pages.searchPlaceholder")}
            aria-label={t("sections.qidirish")}
            className="pl-9 pr-9"
          />
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setQuery("")}
              aria-label={t("pages.clear")}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground" role="status">
            {t("pages.searchLoading")}
          </p>
        ) : tooShort ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t("pages.searchMinChars")}
          </p>
        ) : trimmed.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium text-foreground">{t("pages.searchStart")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("pages.searchStartHint")}
              </p>
            </CardContent>
          </Card>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-medium text-foreground">{t("pages.searchNotFound")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("pages.searchNotFoundHint")}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground" role="status" aria-live="polite">
              {results.length}
              {results.length === MAX_RESULTS ? "+" : ""} {t("pages.searchResults")}
            </p>

            <ol className="space-y-4">
              {results.map((question, idx) =>
                isLocked(question.globalId) ? (
                  <li key={question.globalId ?? idx}>
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                        <Lock className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                        <div>
                          <p className="font-medium text-foreground">{t("pages.proQuestion")}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {t("pages.proQuestionHint")}
                          </p>
                        </div>
                        <Button asChild size="sm">
                          <Link to="/pro">
                            <Crown className="mr-1.5 h-4 w-4" aria-hidden="true" />
                            {t("pages.getPro")}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </li>
                ) : (
                  <li key={question.globalId ?? idx}>
                    <QuestionReviewCard
                      question={question}
                      index={idx + 1}
                      onZoom={setZoomImage}
                      showIzoh={false}
                      action={<SaveQuestionButton globalId={question.globalId} />}
                    />
                  </li>
                ),
              )}
            </ol>
          </>
        )}
      </div>

      <ImageLightbox imageUrl={zoomImage} onClose={() => setZoomImage(null)} />
    </MainLayout>
    </ProSectionGate>
  );
}
