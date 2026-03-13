import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  Home,
  Play,
  Clock,
  HelpCircle,
  CheckCircle,
  Crown
} from "lucide-react";
import { TestInterfaceBase } from "@/components/TestInterfaceBase";
import { TestInterfaceCombined } from "@/components/TestInterfaceCombined";

const languages = [
  { id: "uz-lat" as const, label: "Lotin" },
  { id: "uz" as const, label: "Кирилл" },
  { id: "ru" as const, label: "Русский" },
];

export default function TestIshlash() {
  const [testStarted, setTestStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState<20 | 50>(20);
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { isPro, isTrialActive } = useTrialStatus();

  const brandColor = "#1E2350"; 

  if (testStarted) {
    const dataFile = "barcha.json";
    if (questionCount === 50) {
      return <TestInterfaceCombined onExit={() => setTestStarted(false)} dataSources={[`/${dataFile}`]} testName="Test (50 ta)" questionCount={50} timeLimit={50 * 60} randomize={true} />;
    }
    return <TestInterfaceBase onExit={() => setTestStarted(false)} dataSource={`/${dataFile}`} testName="Test (20 ta)" questionCount={20} timeLimit={25 * 60} randomize={true} variant={user ? 56 : 0} />;
  }

  return (
    <>
      <SEO title="Test ishlash" description="YHQ imtihon testlari" path="/test-ishlash" />
      
      <div className="min-h-screen bg-slate-200 flex flex-col font-sans text-[#1E2350]">
        
        {/* Navbar - Ixchamroq */}
        <header className="w-full bg-slate-200 border-b border-slate-300 px-6 py-3 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 font-bold text-[#1E2350]">
                <Home className="w-4 h-4" /> Bosh sahifa
              </Button>
            </Link>
            <div className="flex bg-slate-100 rounded-lg p-1">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id as any)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                    language === lang.id ? "bg-[#1E2350] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
          
          {/* Pro Banner */}
          {!isPro && !isTrialActive && (
            <Link to="/pro" className="group flex items-center gap-4 bg-white border-2 border-orange-400 rounded-2xl px-5 py-4 hover:border-orange-500 hover:bg-orange-50/30 transition-all active:scale-[0.99]">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-orange-600 font-bold text-base leading-tight">PRO VERSIYA <span className="text-orange-400">✦</span></p>
                <p className="text-slate-500 text-sm mt-0.5"><span className="font-bold text-slate-700">1200+</span> savol bilan imtihonga tayyor bo'ling</p>
              </div>
            </Link>
          )}

          {/* Asosiy Container */}
          <div className="bg-white rounded-3xl border border-slate-300 shadow-2xl shadow-slate-400/30 overflow-hidden">
            {/* Header qismi */}
            <div className="px-8 py-6 border-b border-slate-200 flex items-center gap-4 bg-slate-50">
              <div className="w-11 h-11 rounded-2xl bg-[#1E2350] flex items-center justify-center shadow-md shadow-[#1E2350]/30">
                <Play className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#1E2350]">Test ishlash</h1>
                <p className="text-slate-500 text-sm font-semibold">{questionCount} ta tasodifiy savol • {questionCount === 20 ? "25" : "50"} daqiqa</p>
              </div>
            </div>

            <div className="p-6 flex flex-col md:flex-row gap-6">
              {/* Chap - Savol soni tanlash */}
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3 text-center">Savollar sonini tanlang</p>
                <div className="grid grid-cols-2 gap-3">
                  {[20, 50].map((num) => (
                    <button
                      key={num}
                      onClick={() => setQuestionCount(num as 20 | 50)}
                      className={`relative py-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                        questionCount === num
                        ? "border-[#1E2350] bg-[#1E2350]/5 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {questionCount === num && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#1E2350] flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className={`text-4xl font-black leading-none ${questionCount === num ? "text-[#1E2350]" : "text-slate-400"}`}>{num}</span>
                      <span className="text-sm font-semibold text-slate-500 mt-1">savollar</span>
                      <span className="text-sm text-slate-400">{num === 20 ? "25 daqiqa" : "50 daqiqa"}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* O'ng - Statistika va Tugma */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: HelpCircle, value: questionCount, label: "Savollar" },
                    { icon: Clock, value: questionCount === 20 ? 25 : 50, label: "Daqiqa" },
                    { icon: CheckCircle, value: "90%", label: "O'tish", green: true },
                  ].map(({ icon: Icon, value, label, green }) => (
                    <div key={label} className="flex flex-col items-center gap-2 bg-slate-100/80 rounded-2xl py-4">
                      <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center">
                        <Icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className={`text-xl font-black leading-none ${green ? "text-emerald-600" : "text-[#1E2350]"}`}>{value}</span>
                      <span className="text-xs font-semibold text-slate-500">{label}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => setTestStarted(true)}
                  style={{ backgroundColor: brandColor }}
                  className="w-full h-14 rounded-xl text-white text-base font-black shadow-lg shadow-[#1E2350]/25 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-auto"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Testni boshlash
                </Button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400">
            Testni boshlash uchun ro'yxatdan o'tish shart emas
          </p>
        </main>
      </div>
    </>
  );
}