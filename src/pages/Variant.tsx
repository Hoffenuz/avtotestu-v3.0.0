import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProAccess } from "@/hooks/useProAccess";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { TestStartPage } from "@/components/TestStartPage";
import { TestInterface } from "@/components/TestInterface";

export default function Variant() {
  const [testStarted, setTestStarted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const { user, isLoading } = useAuth();
  const { hasAccess, loading: accessLoading } = useProAccess();
  const navigate = useNavigate();

  if (isLoading || accessLoading) {
    return (
      <MainLayout>
        <SEO 
          title="Test variantlari - 61 variant"
          description="Haydovchilik guvohnomasi uchun 61 test varianti. Haqiqiy imtihon formatida test ishlang va o'z bilimlaringizni sinab ko'ring."
          path="/variant"
          keywords="test varianti, prava test, imtihon savollari, YHQ test"
        />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!user || !hasAccess) {
    return null;
  }

  if (testStarted && selectedVariant !== null) {
    return (
      <TestInterface 
        onExit={() => {
          setTestStarted(false);
          setSelectedVariant(null);
        }} 
        variant={selectedVariant}
      />
    );
  }

  return (
    <TestStartPage 
      onStartTest={(variant: number) => {
        setSelectedVariant(variant);
        setTestStarted(true);
      }} 
    />
  );
}
