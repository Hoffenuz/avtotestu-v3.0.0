import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { DeviceLicenseInstructions } from "@/components/DeviceLicenseInstructions";
import {
  Monitor,
  Download,
  WifiOff,
  KeyRound,
  Play,
  Laptop,
  Zap,
  Smartphone,
} from "lucide-react";
import {
  DESKTOP_APP_DOWNLOAD_URL,
  DESKTOP_APP_FILENAME,
  DESKTOP_APP_SIZE_MB,
  isMobileDevice,
} from "@/lib/desktopApp";

const perks = [
  "Internet bo'lmasa ham test ishlang",
  "Katta ekranda qulay o'rganing",
  "Tez va barqaror mahalliy ilova",
];

export default function DesktopApp() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  return (
    <MainLayout>
      <SEO
        title="Desktop ilova — Offline YHQ test"
        description="Avtotestlar.uz Windows desktop ilovasini yuklab oling. Internetsiz YHQ testlari, katta ekranda qulay o'rganish. Haydovchilik guvohnomasi imtihoniga offline tayyorgarlik."
        path="/desktop"
        keywords="avtotestlar desktop, offline test, windows ilova, prava test offline"
      />

      {isMobile ? (
        <section className="min-h-[calc(100vh-4rem)] bg-neutral-50 flex items-center justify-center py-10 px-4">
          <div className="max-w-md w-full rounded-2xl border border-border bg-white shadow-md p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-amber-600" />
            </div>
            <h1
              className="text-xl font-bold text-foreground mb-3"
              style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
            >
              Bu bo&apos;lim kompyuter uchun
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Kompyuter ilovasini yuklab olish uchun iltimos, boshqa qurilmadan
              (kompyuter yoki noutbuk) kiring.
            </p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <Laptop className="w-4 h-4" />
                Bosh sahifaga qaytish
              </Button>
            </Link>
          </div>
        </section>
      ) : (
      <section className="min-h-[calc(100vh-4rem)] bg-neutral-50 flex items-start py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-4 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-start">

            {/* Chap — ma'lumotlar */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full mb-4">
                  <Laptop className="w-3.5 h-3.5" />
                  Windows desktop
                </span>
                <h1
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-3"
                  style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
                >
                  Kompyuter uchun ilovamizni yuklab oling
                </h1>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">
                  Avtotestlar desktop ilovasini o&apos;rnating va internetsiz ham
                  test ishlashingiz mumkin. PRO uchun aktivatsiya kalitini{" "}
                  <Link to="/profile" className="text-primary hover:underline font-medium">
                    profil
                  </Link>{" "}
                  bo&apos;limidan oling.
                </p>
              </div>

              <ul className="space-y-2.5">
                {perks.map((text) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm text-foreground">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Zap className="w-3 h-3 text-emerald-600" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>

              {/* Video joyi — ixcham */}
              <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
                <div className="relative aspect-[16/7] bg-neutral-100 flex flex-col items-center justify-center gap-2">
                  <div className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center border border-border">
                    <Play className="w-5 h-5 text-foreground/60 ml-0.5" />
                  </div>
                  <p className="text-xs text-muted-foreground">Qo&apos;llanma videosi tez orada</p>
                </div>
              </div>

            </div>

            {/* O'ng — yuklab olish kartasi */}
            <div className="lg:col-span-2 lg:-mt-2 self-start">
              <div className="rounded-2xl border border-border bg-white shadow-md p-6 md:p-8 sticky top-16">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-neutral-100 border border-border flex items-center justify-center">
                  <Monitor className="w-8 h-8 text-foreground/70" />
                </div>

                <h2 className="text-xl font-bold text-center text-foreground mb-1">
                  Yuklab olish
                </h2>
                <p className="text-center text-sm text-muted-foreground mb-6">
                  Windows 10/11 uchun o&apos;rnatuvchi
                </p>

                <Button
                  size="lg"
                  asChild
                  className="w-full gap-2 text-base py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 border-0"
                >
                  <a
                    href={DESKTOP_APP_DOWNLOAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-5 h-5" />
                    Yuklab olish
                  </a>
                </Button>

                <div className="mt-4 space-y-2 text-center">
                  <p className="text-xs font-mono text-muted-foreground">{DESKTOP_APP_FILENAME}</p>
                  <p className="text-xs text-muted-foreground">~{DESKTOP_APP_SIZE_MB} MB · Windows</p>
                </div>

                <div className="mt-6 pt-5 border-t border-border space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                      <WifiOff className="w-4 h-4 text-foreground/60" />
                    </div>
                    <span className="text-muted-foreground text-xs leading-snug">
                      O&apos;rnatgandan keyin internetsiz ishlaydi
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                      <KeyRound className="w-4 h-4 text-foreground/60" />
                    </div>
                    <span className="text-muted-foreground text-xs leading-snug">
                      PRO uchun{" "}
                      <Link to="/profile" className="text-primary hover:underline">
                        profildan
                      </Link>{" "}
                      kalit oling
                    </span>
                  </div>
                </div>

                <DeviceLicenseInstructions className="mt-6" />
              </div>
            </div>

          </div>
        </div>
      </section>
      )}
    </MainLayout>
  );
}
