import { useState, type FormEvent } from "react";
import { Star, Send, Loader2, MessageSquareQuote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export function UserReviewSection() {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const shouldPromptComment = rating > 0 && rating <= 3;

  const resetForm = () => {
    setRating(0);
    setComment("");
    setError("");
    setIsSubmitted(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!rating) {
      setError(t("home.reviewRatingRequired"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from("reviews").insert({
        user_id: user?.id ?? null,
        rating,
        comment: comment.trim() || null,
        page: "home",
      });

      if (insertError) {
        if (insertError.message.includes("review_rate_limit_exceeded")) {
          setError(t("home.reviewRateLimitError"));
        } else {
          setError(t("home.reviewGenericError"));
        }
        return;
      }

      toast.success(t("home.reviewSuccessToast"));
      setIsSubmitted(true);
    } catch {
      setError(t("home.reviewGenericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <Card className="overflow-hidden rounded-3xl border border-border/70 shadow-xl">
            <CardContent className="p-6 sm:p-8 md:p-10 text-center bg-gradient-to-br from-primary/5 via-background to-amber-500/5">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <MessageSquareQuote className="h-7 w-7" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
                {t("home.reviewSuccessTitle")}
              </h2>
              <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {t("home.reviewSuccessText")}
              </p>
              <Button className="mt-6 h-11 rounded-xl px-5" variant="outline" onClick={resetForm}>
                {t("home.reviewAgain")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        <Card className="overflow-hidden rounded-3xl border border-border/70 shadow-xl">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="p-5 sm:p-6 md:p-8 lg:p-10 bg-gradient-to-br from-primary/6 via-background to-amber-500/8 border-b lg:border-b-0 lg:border-r border-border/60 flex flex-col justify-between gap-5 md:gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-[0.24em] text-amber-600">
                    <MessageSquareQuote className="h-3.5 w-3.5" />
                    Fikr qoldiring
                  </div>
                  <h2 className="mt-4 text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
                    {t("home.reviewTitle")}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm md:text-base leading-relaxed text-muted-foreground">
                    {t("home.reviewSubtitle")}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                    <p className="font-semibold text-foreground">1-5 yulduzcha</p>
                    <p className="mt-1 text-muted-foreground">Bitta bosish bilan baholang.</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                    <p className="font-semibold text-foreground">Izoh ixtiyoriy</p>
                    <p className="mt-1 text-muted-foreground">Fikr yozsangiz, biz uchun foydali.</p>
                  </div>
                </div>
              </div>

              <form className="p-5 sm:p-6 md:p-8 lg:p-10 bg-card" onSubmit={handleSubmit}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                    {t("home.reviewStarsLabel")}
                  </span>
                  <span className="text-sm font-semibold text-foreground/70">{rating ? `${rating}/5` : "0/5"}</span>
                </div>

                <div className="mt-4 grid grid-cols-5 gap-2 max-w-[280px] sm:max-w-none">
                  {STAR_VALUES.map((star) => {
                    const active = star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        aria-label={`${star} yulduz`}
                        aria-pressed={active}
                        onClick={() => setRating(star)}
                        className={`flex h-12 w-full items-center justify-center rounded-2xl border transition-all duration-200 sm:h-14 ${
                          active
                            ? "border-amber-400 bg-amber-500/10 text-amber-500 shadow-sm"
                            : "border-border bg-muted/30 text-muted-foreground hover:border-amber-300 hover:bg-amber-500/5 hover:text-amber-400"
                        }`}
                      >
                        <Star className={`h-5 w-5 sm:h-6 sm:w-6 ${active ? "fill-current" : ""}`} />
                      </button>
                    );
                  })}
                </div>

                {shouldPromptComment && (
                  <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300">
                    {t("home.reviewLowPrompt")}
                  </div>
                )}

                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={shouldPromptComment ? t("home.reviewCommentPlaceholderLow") : t("home.reviewCommentPlaceholder")}
                  maxLength={500}
                  className={`mt-4 min-h-[130px] rounded-2xl text-sm sm:text-base ${
                    shouldPromptComment ? "border-amber-500/30 focus-visible:ring-amber-500/30" : ""
                  }`}
                />

                {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}

                <Button
                  type="submit"
                  className="mt-5 h-11 sm:h-12 w-full rounded-2xl bg-[#1E2350] text-sm sm:text-base font-semibold text-white hover:bg-[#151a3f]"
                  disabled={isSubmitting || rating === 0}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("home.reviewSending")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      {t("home.reviewSubmit")}
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
