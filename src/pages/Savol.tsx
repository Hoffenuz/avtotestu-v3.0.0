import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import savolIndex from "@/data/savol-v59-index.json";

interface SavolOption {
  id: number;
  label: string;
  text: string;
  isCorrect: boolean;
}

interface SavolItem {
  globalId: string;
  slug: string;
  order: number;
  ticketNum: number;
  text: string;
  options: SavolOption[];
  correctId: number;
  correctText: string;
  explanation: string;
  imageUrl: string | null;
  topicLabel: string;
  topicLink: string;
  canonicalPath: string;
  globalIdPath: string;
}

const questions = savolIndex.questions as SavolItem[];

function findQuestion(param: string | undefined): SavolItem | undefined {
  if (!param) return undefined;
  const bySlug = questions.find((q) => q.slug === param);
  if (bySlug) return bySlug;
  return questions.find((q) => q.globalId === param);
}

export default function Savol() {
  const { slug } = useParams<{ slug: string }>();
  const question = useMemo(() => findQuestion(slug), [slug]);

  if (!question) {
    return (
      <MainLayout>
        <SEO
          title="Savol topilmadi"
          description="Ushbu YHQ savoli topilmadi."
          path={`/savol/${slug ?? ""}`}
          noIndex
        />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-3">Savol topilmadi</h1>
          <p className="text-muted-foreground mb-6">Bunday savol mavjud emas.</p>
          <Link to="/savol/variant-59" className="text-primary font-semibold hover:underline">
            Variant 59 savollar ro'yxati
          </Link>
        </div>
      </MainLayout>
    );
  }

  const idx = questions.findIndex((q) => q.globalId === question.globalId);
  const prev = idx > 0 ? questions[idx - 1] : null;
  const next = idx < questions.length - 1 ? questions[idx + 1] : null;
  const others = questions.filter((q) => q.globalId !== question.globalId);

  const seoTitle = question.text.length > 55 ? question.text.slice(0, 52) + "…" : question.text;
  const seoDescription = `${question.text.slice(0, 120)}… To'g'ri javob: ${question.correctText.slice(0, 80)}`;

  return (
    <MainLayout>
      <SEO
        title={seoTitle}
        description={seoDescription}
        path={question.canonicalPath}
        ogImage={question.imageUrl ?? undefined}
      />

      <article className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <nav className="text-sm text-muted-foreground mb-4 flex flex-wrap gap-x-3 gap-y-1">
          <Link to="/" className="hover:text-primary">Bosh sahifa</Link>
          <span>·</span>
          <Link to="/savol/variant-59" className="hover:text-primary">Variant {question.ticketNum}</Link>
          <span>·</span>
          <span>{question.order}/20 savol</span>
        </nav>

        <h1 className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-6">
          {question.text}
        </h1>

        {question.imageUrl && (
          <figure className="mb-6 rounded-xl border bg-card overflow-hidden">
            <img
              src={question.imageUrl.replace("https://www.avtotestu.uz", "")}
              alt={question.text}
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </figure>
        )}

        <ol className="space-y-2 mb-6 list-none">
          {question.options.map((opt) => (
            <li
              key={opt.id}
              className={`rounded-lg border px-4 py-3 text-sm md:text-base ${
                opt.isCorrect
                  ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                  : "border-border bg-card"
              }`}
            >
              <span className="font-bold mr-2">{opt.label}.</span>
              {opt.text}
              {opt.isCorrect && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> To'g'ri
                </span>
              )}
            </li>
          ))}
        </ol>

        <section className="rounded-xl border bg-card p-4 mb-4">
          <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground mb-2">
            To'g'ri javob
          </h2>
          <p className="font-medium">
            {question.options.find((o) => o.isCorrect)?.label}. {question.correctText}
          </p>
        </section>

        <section className="rounded-xl border bg-muted/40 p-4 mb-6">
          <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground mb-2">
            Tushuntirish
          </h2>
          <p className="text-sm md:text-base leading-relaxed text-foreground/90">
            {question.explanation}
          </p>
          <Link
            to={question.topicLink}
            className="inline-block mt-3 text-sm font-semibold text-primary hover:underline"
          >
            📘 {question.topicLabel}
          </Link>
        </section>

        <div className="flex justify-between gap-4 mb-8">
          {prev ? (
            <Link
              to={prev.canonicalPath}
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <ChevronLeft className="w-4 h-4" /> {prev.order}-savol
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              to={next.canonicalPath}
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline ml-auto"
            >
              {next.order}-savol <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <section>
          <h2 className="font-bold text-lg mb-3">Variant {question.ticketNum} — boshqa savollar</h2>
          <ul className="space-y-2">
            {others.map((q) => (
              <li key={q.globalId}>
                <Link
                  to={q.canonicalPath}
                  className="text-sm text-primary hover:underline line-clamp-2"
                >
                  {q.order}. {q.text}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/test-ishlash"
            className="inline-block mt-5 px-5 py-2.5 rounded-lg bg-amber-400 text-[#1E2350] font-bold text-sm hover:bg-amber-300 transition-colors"
          >
            Onlayn test topshirish
          </Link>
        </section>
      </article>
    </MainLayout>
  );
}
