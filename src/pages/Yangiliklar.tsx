import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Loader2, Newspaper } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { formatNewsDate, getNewsLocalized, type NewsPost } from "@/lib/newsPosts";

export default function Yangiliklar() {
  const { language } = useLanguage();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("news_posts")
        .select("*")
        .order("published_at", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        if (!import.meta.env.PROD) console.error("[Yangiliklar]", fetchError);
        setError(
          language === "ru"
            ? "Не удалось загрузить новости."
            : "Yangiliklarni yuklab bo'lmadi."
        );
        setPosts([]);
      } else {
        setPosts((data ?? []) as NewsPost[]);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [language]);

  const pageTitle =
    language === "ru" ? "Новости Avtotestlar.uz" : language === "uz" ? "Yangiliklar" : "Yangiliklar";
  const pageDescription =
    language === "ru"
      ? "Официальные новости Avtotestlar.uz: обновления тестов ПДД, PRO-подписка, видеоуроки и полезные советы."
      : "Avtotestlar.uz rasmiy yangiliklari: YHQ testlari, PRO obuna, video darslik va foydali maslahatlar.";

  return (
    <MainLayout>
      <SEO
        title={pageTitle}
        description={pageDescription}
        path="/yangiliklar"
        keywords="avtotestlar yangiliklar, YHQ yangiliklari, prava test yangiliklari, haydovchilik guvohnomasi"
      />

      <section className="bg-gradient-to-br from-primary via-primary-hover to-primary-light py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold text-primary-foreground mb-4">
            <Newspaper className="w-3.5 h-3.5" />
            {language === "ru" ? "Официальные новости" : "Rasmiy yangiliklar"}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3">
            {pageTitle}
          </h1>
          <p className="text-primary-foreground/85 max-w-2xl mx-auto leading-relaxed">
            {pageDescription}
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              {language === "ru" ? "Загрузка..." : "Yuklanmoqda..."}
            </div>
          )}

          {!loading && error && (
            <Card className="border border-destructive/20">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                {error}
                <p className="mt-2 text-xs">
                  {language === "ru"
                    ? "Попробуйте обновить страницу позже."
                    : "Birozdan keyin sahifani yangilab ko'ring."}
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && posts.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {language === "ru" ? "Пока нет опубликованных новостей." : "Hozircha e'lon qilingan yangilik yo'q."}
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {posts.map((post) => {
              const localized = getNewsLocalized(post, language);
              return (
                <Link key={post.id} to={`/yangiliklar/${post.slug}`} className="block group">
                  <Card className="transition-all hover:border-primary/40 hover:shadow-md">
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatNewsDate(post.published_at, language)}
                          </div>
                          <h2 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {localized.title}
                          </h2>
                          {localized.excerpt && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                              {localized.excerpt}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
