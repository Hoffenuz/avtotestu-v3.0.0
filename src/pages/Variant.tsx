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

  // TestStartPage has its own full-page layout (header, profile, language)
  // so we render it without MainLayout wrapper, same as MavzuliTestlar
  return (
    <>
      <SEO
        title="Test variantlari - 61 variant"
        description="Haydovchilik guvohnomasi uchun 61 test varianti."
        path="/variant"
        keywords="test varianti, prava test, imtihon savollari, YHQ test"
      />
      {starting ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <TestStartPage onStartTest={handleStartTest} startError={startError} />
      )}
    </>
  );
}
