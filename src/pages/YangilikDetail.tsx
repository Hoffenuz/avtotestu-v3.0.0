import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ArticleSEO } from "@/components/ArticleSEO";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { formatNewsDate, getNewsLocalized, type NewsPost } from "@/lib/newsPosts";
import NotFound from "./NotFound";

export default function YangilikDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setNotFound(true);
        setPost(null);
      } else {
        setPost(data as NewsPost);
        setNotFound(false);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[50vh] flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          {language === "ru" ? "Загрузка..." : "Yuklanmoqda..."}
        </div>
      </MainLayout>
    );
  }

  if (notFound || !post) {
    return <NotFound />;
  }

  const localized = getNewsLocalized(post, language);
  const path = `/yangiliklar/${post.slug}`;

  return (
    <MainLayout>
      <ArticleSEO
        title={localized.title}
        description={localized.metaDescription || localized.excerpt || localized.title}
        path={path}
        publishedAt={post.published_at || post.created_at}
        updatedAt={post.updated_at}
        ogImage={post.cover_image_url || undefined}
        keywords="avtotestlar yangilik, YHQ, prava test, haydovchilik guvohnomasi"
      />

      <article className="py-8 md:py-12 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/yangiliklar">
            <Button variant="ghost" className="gap-2 mb-6 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              {language === "ru" ? "Все новости" : language === "uz" ? "Барча yangiliklar" : "Barcha yangiliklar"}
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="w-4 h-4" />
            {formatNewsDate(post.published_at, language)}
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight mb-6">
            {localized.title}
          </h1>

          {post.cover_image_url && (
            <div className="mb-8 overflow-hidden rounded-2xl border border-border">
              <img
                src={post.cover_image_url}
                alt={localized.title}
                className="w-full max-h-[420px] object-cover"
                loading="lazy"
              />
            </div>
          )}

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {localized.body.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index} className="text-base leading-8 text-foreground/90 mb-4 whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>
    </MainLayout>
  );
}
