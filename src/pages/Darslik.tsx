import { Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { BookOpen, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getOrderedChapters } from "@/data/videoDarslar";
import { ChapterAccordion } from "@/components/darslik/ChapterAccordion";

export default function Darslik() {
  const { user, profile, isLoading } = useAuth();
  const chapters = getOrderedChapters();

  // Redirect guests to /auth
  if (!isLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO
        title="Video Darslik - YHQ bo'yicha video darslar"
        description="Yo'l harakati qoidalari bo'yicha video darsliklar. Haydovchilik guvohnomasiga tayyorlanish uchun o'quv materiallari."
        path="/darslik"
        keywords="YHQ darslik, video darslar, haydovchilik kursi, avto darslik"
      />

      {/* Compact Hero */}
      <section className="bg-gradient-to-br from-primary via-primary-hover to-primary py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center backdrop-blur-sm">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary-foreground leading-tight">
                Video Darslik
              </h1>
              <p className="text-xs text-primary-foreground/70 hidden md:block">
                YHQ bo'yicha video darsliklar
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-primary-foreground/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <BookOpen className="w-3.5 h-3.5 text-primary-foreground" />
            <span className="text-xs text-primary-foreground/90">
              {chapters.length} bo'lim · {chapters.reduce((sum, c) => sum + c.data.length, 0)} video
            </span>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-4 md:py-6 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <ChapterAccordion chapters={chapters} />
        </div>
      </section>
    </MainLayout>
  );
}
