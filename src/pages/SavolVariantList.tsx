import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import savolIndex from "@/data/savol-v59-index.json";

const questions = savolIndex.questions as Array<{
  order: number;
  text: string;
  canonicalPath: string;
  imageUrl: string | null;
  ticketNum: number;
}>;

export default function SavolVariantList() {
  const ticketNum = questions[0]?.ticketNum ?? 59;

  return (
    <MainLayout>
      <SEO
        title={`Variant ${ticketNum} — 20 ta YHQ savoli`}
        description={`YHQ test varianti ${ticketNum}: 20 ta savol, rasmlar va to'g'ri javoblar bilan. Haydovchilik guvohnomasi imtihoniga tayyorgarlik.`}
        path={`/savol/variant-${ticketNum}`}
        keywords="YHQ savollari, prava test, variant 59, avtotest"
      />

      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Bosh sahifa</Link>
          <span className="mx-2">·</span>
          <Link to="/variant" className="hover:text-primary">Variantlar</Link>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold mb-3">
          Variant {ticketNum} — barcha savollar
        </h1>
        <p className="text-muted-foreground mb-8">
          20 ta YHQ savoli to'g'ri javob va qisqa tushuntirish bilan.
        </p>

        <ul className="space-y-3">
          {questions.map((q) => (
            <li key={q.order}>
              <Link
                to={q.canonicalPath}
                className="block rounded-lg border bg-card px-4 py-3 hover:border-primary/50 transition-colors"
              >
                <span className="font-bold text-primary mr-2">{q.order}.</span>
                {q.text}
                {q.imageUrl && (
                  <span className="ml-2 text-xs text-muted-foreground">🖼 rasm bilan</span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          to="/test-ishlash"
          className="inline-block mt-8 px-5 py-2.5 rounded-lg bg-amber-400 text-[#1E2350] font-bold text-sm hover:bg-amber-300 transition-colors"
        >
          Onlayn test topshirish
        </Link>
      </div>
    </MainLayout>
  );
}
