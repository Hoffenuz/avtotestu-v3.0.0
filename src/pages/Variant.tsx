import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useTestSession } from "@/hooks/useTestSession";
import { SEO } from "@/components/SEO";
import { TestStartPage } from "@/components/TestStartPage";
import { TestInterface } from "@/components/TestInterface";
import {
  getVariantDataId,
  isVariantLocked,
} from "@/lib/variantAccess";

export default function Variant() {
  const { user, isLoading } = useAuth();
  const { isPremium, loading: accessLoading, backendConfirmed } = useAccessState();
  const { starting, startSession } = useTestSession();

  const variantStorageKey = user ? `variant_activeTest_${user.id}` : null;

  const getInitialState = () => {
    if (!variantStorageKey) {
      return {
        testStarted: false,
        selectedVariant: null as number | null,
        dataVariant: null as number | null,
        sessionId: null as string | null,
      };
    }
    try {
      const saved = localStorage.getItem(variantStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.testStarted && parsed.selectedVariant != null) {
          const testKey = `testState_variant_${parsed.selectedVariant}_${user!.id}`;
          if (!localStorage.getItem(testKey)) {
            localStorage.removeItem(variantStorageKey);
            return {
              testStarted: false,
              selectedVariant: null as number | null,
              dataVariant: null as number | null,
              sessionId: null as string | null,
            };
          }
          return {
            testStarted: true,
            selectedVariant: parsed.selectedVariant as number,
            dataVariant: (parsed.dataVariant ?? parsed.selectedVariant) as number,
            sessionId: (parsed.sessionId ?? null) as string | null,
          };
        }
      }
    } catch (e) { /* ignore */ }
    return {
      testStarted: false,
      selectedVariant: null as number | null,
      dataVariant: null as number | null,
      sessionId: null as string | null,
    };
  };

  const initial = getInitialState();
  const [testStarted, setTestStarted] = useState(initial.testStarted);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(initial.selectedVariant);
  const [dataVariant, setDataVariant] = useState<number | null>(initial.dataVariant);
  const [sessionId, setSessionId] = useState<string | null>(initial.sessionId);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (!variantStorageKey) return;
    try {
      if (testStarted && selectedVariant !== null) {
        localStorage.setItem(
          variantStorageKey,
          JSON.stringify({ testStarted, selectedVariant, dataVariant, sessionId })
        );
      } else {
        localStorage.removeItem(variantStorageKey);
      }
    } catch (e) { /* ignore */ }
  }, [variantStorageKey, testStarted, selectedVariant, dataVariant, sessionId]);

  // PRO muddati tugasa yoki qulflangan variant saqlangan bo'lsa — sessiyani tozalash.
  // Faqat backend tasdiqlaganda: RPC fail bo'lsa isPremium=false bo'lishi mumkin —
  // o'sha holda faol testni o'chirmaymiz (sekin internetda "chiqarib yuborish").
  useEffect(() => {
    if (isLoading || accessLoading || !backendConfirmed) return;
    if (testStarted && selectedVariant !== null && isVariantLocked(selectedVariant, isPremium)) {
      setTestStarted(false);
      setSelectedVariant(null);
      setDataVariant(null);
      setSessionId(null);
    }
  }, [isLoading, accessLoading, backendConfirmed, testStarted, selectedVariant, isPremium]);

  if (isLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (testStarted && selectedVariant !== null) {
    return (
      <TestInterface
        onExit={() => {
          setTestStarted(false);
          setSelectedVariant(null);
          setDataVariant(null);
          setSessionId(null);
          setStartError(null);
        }}
        variant={selectedVariant}
        dataVariant={dataVariant ?? selectedVariant}
        sessionId={sessionId}
        isPremiumSession={isPremium}
      />
    );
  }

  const handleStartTest = async (variant: number) => {
    setStartError(null);

    if (isVariantLocked(variant, isPremium)) {
      setStartError("Barcha variantlarni ochish uchun PRO obuna oling.");
      return;
    }

    const fileId = getVariantDataId(variant, isPremium);

    const result = await startSession({
      variant,
      questionSource: `v${fileId}.json`,
      isPremium,
    });

    if (!result.ok) {
      if (result.error === "no_premium_access") {
        setStartError("Bu variantni boshlash uchun PRO obuna kerak.");
      } else {
        setStartError("Serverga ulanishda xatolik. Qayta urinib ko'ring.");
      }
      return;
    }

    setSessionId(result.session?.sessionId ?? null);
    setSelectedVariant(variant);
    setDataVariant(fileId);
    setTestStarted(true);
  };

  return (
    <>
      <SEO
        title="Test variantlari — 63 ta YHQ varianti"
        description="Haydovchilik guvohnomasi uchun 63 ta YHQ test varianti. Haqiqiy imtihon formatida. Prava imtihoniga to'liq tayyorgarlik — Avtotestlar.uz."
        path="/variant"
        keywords="test varianti, prava test, imtihon savollari, YHQ test, 63 variant"
      />
      {starting ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <TestStartPage
          onStartTest={handleStartTest}
          startError={startError}
          hasProAccess={isPremium}
        />
      )}
    </>
  );
}
