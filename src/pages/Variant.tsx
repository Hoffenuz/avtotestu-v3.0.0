import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProAccess } from "@/hooks/useProAccess";
import { useTestSession } from "@/hooks/useTestSession";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { TestStartPage } from "@/components/TestStartPage";
import { TestInterface } from "@/components/TestInterface";
import { AlertTriangle } from "lucide-react";

export default function Variant() {
  const [testStarted, setTestStarted]         = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [sessionId, setSessionId]             = useState<string | null>(null);
  const [startError, setStartError]           = useState<string | null>(null);

  const { user, isLoading } = useAuth();
  const { hasAccess, loading: accessLoading } = useProAccess();
  const { starting, startSession } = useTestSession();

  if (isLoading || accessLoading || !hasAccess) {
    return (
      <MainLayout>
        <SEO
          title="Test variantlari - 61 variant"
          description="Haydovchilik guvohnomasi uchun 61 test varianti."
          path="/variant"
          keywords="test varianti, prava test, imtihon savollari, YHQ test"
        />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  // Test in progress
  if (testStarted && selectedVariant !== null) {
    return (
      <TestInterface
        onExit={() => {
          setTestStarted(false);
          setSelectedVariant(null);
          setSessionId(null);
          setStartError(null);
        }}
        variant={selectedVariant}
        sessionId={sessionId}
        isPremiumSession={true}
      />
    );
  }

  const handleStartTest = async (variant: number) => {
    setStartError(null);
    const result = await startSession({
      variant,
      questionSource: `v${variant}.json`,
      isPremium: true,
    });

    if (!result.ok) {
      if (result.error === 'no_premium_access') {
        setStartError('Bu variantni boshlash uchun PRO obuna kerak.');
      } else {
        setStartError('Serverga ulanishda xatolik. Qayta urinib ko\'ring.');
      }
      return;
    }

    setSessionId(result.session?.sessionId ?? null);
    setSelectedVariant(variant);
    setTestStarted(true);
  };

  return (
    <MainLayout>
      <SEO
        title="Test variantlari - 61 variant"
        description="Haydovchilik guvohnomasi uchun 61 test varianti."
        path="/variant"
        keywords="test varianti, prava test, imtihon savollari, YHQ test"
      />
      {startError && (
        <div className="max-w-xl mx-auto mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{startError}</p>
        </div>
      )}
      {starting && (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      {!starting && (
        <TestStartPage onStartTest={handleStartTest} />
      )}
    </MainLayout>
  );
}
