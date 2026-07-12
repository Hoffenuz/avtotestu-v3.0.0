import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, SearchX, ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    if (!import.meta.env.PROD) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <MainLayout>
      <SEO title={t("notFound.seoTitle")} description={t("notFound.description")} path="/" noIndex />
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16 bg-background">
        <div className="max-w-lg w-full text-center">
          <div className="relative mx-auto mb-8 w-28 h-28">
            <div className="absolute inset-0 rounded-full bg-muted" />
            <div className="relative flex items-center justify-center w-full h-full">
              <SearchX className="w-12 h-12 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <span className="absolute -bottom-1 -right-1 text-5xl font-black text-primary/20 select-none leading-none">
              404
            </span>
          </div>

          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">
            {t("notFound.code")}
          </p>
          <h1
            className="text-2xl md:text-3xl font-bold text-foreground mb-3"
            style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
          >
            {t("notFound.heading")}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8 max-w-md mx-auto">
            {t("notFound.description")}
          </p>
          <p className="text-xs text-muted-foreground/70 mb-8 font-mono break-all">{location.pathname}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2 font-semibold">
              <Link to="/">
                <Home className="w-4 h-4" />
                {t("notFound.backHome")}
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="gap-2" type="button" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4" />
              {t("notFound.goBack")}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
