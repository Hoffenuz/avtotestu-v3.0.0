import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { 
  Play, 
  Car, 
  BookOpen, 
  Crown, 
  ChevronRight, 
  User, 
  Settings, 
  LogOut, 
  TrendingUp,
  ShieldCheck,
  Zap,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNotificationBanner } from "@/components/SiteNotificationBanner";

export default function Home() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Ism bosh harflarini olish
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "UZ";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <MainLayout>
      <SiteNotificationBanner />
      <SEO 
        title="Avtotestu.uz - Onlayn Avtomaktab va Imtihonlar"
        description="2026-yilgi eng yangi savollar asosida haydovchilik guvohnomasi imtihoniga tayyorlaning."
        path="/"
        keywords="avtotest, prava olish, yo'l harakati qoidalari, onlayn test"
      />

      {/* 1. HERO SECTION - Zamonaviy va Keng */}
      <section className="relative bg-slate-900 overflow-hidden pb-16 pt-8 md:pt-12">
        {/* Orqa fon bezaklari (Yo'l chiziqlari effekti) */}
        <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent dashed"></div>
            <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent dashed"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            
            {/* Chap tomon: Matn va Taklif */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                2026-yilgi yangi baza
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
                Xavfsiz haydovchi <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                  bo'lish vaqti keldi!
                </span>
              </h1>
              
              <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Avtotestu.uz — bu shunchaki test emas. Bu sizning shaxsiy avto-instruktoringiz. 
                Nazariyani o'rganing, xatolarni tahlil qiling va imtihondan 100% o'ting.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/test-ishlash" className="w-full sm:w-auto">
                  <button className="group relative w-full sm:w-auto flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-600/30 active:scale-95">
                    <Play className="w-6 h-6 fill-white" />
                    Testni Boshlash
                    <div className="absolute right-2 top-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </button>
                </Link>
                <Link to="/belgilar" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-8 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95">
                    <Car className="w-6 h-6" />
                    Yo'l Belgilari
                  </button>
                </Link>
              </div>
            </div>

            {/* O'ng tomon: PROFIL KARTASI (ID Card Style) */}
            <div className="flex-1 w-full max-w-md perspective-1000">
              {user ? (
                // LOGGED IN: PRAVA KO'RINISHIDAGI PROFIL
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl transform rotate-1 hover:rotate-0 transition-all duration-500 group">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-white text-xs">UZ</span>
                      </div>
                      <span className="text-slate-400 text-xs font-mono tracking-widest uppercase">Haydovchilik guvohnomasi</span>
                    </div>
                    {profile?.is_pro && (
                      <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg text-xs font-bold text-black flex items-center gap-1 shadow-lg shadow-yellow-500/20">
                        <Crown className="w-3 h-3 fill-black" /> PRO
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="flex gap-5">
                    <div className="flex flex-col gap-3">
                        <div className="w-24 h-28 bg-slate-700 rounded-xl overflow-hidden border-2 border-slate-600 shadow-inner flex items-center justify-center relative">
                            {/* Avatar Placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50"></div>
                            <span className="text-2xl font-bold text-slate-500">
                                {getInitials(profile?.full_name)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Ism Sharif</p>
                            <h3 className="text-white font-bold text-lg truncate">{profile?.full_name || "Foydalanuvchi"}</h3>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Username</p>
                            <p className="text-slate-300 font-mono text-sm">@{profile?.username || "username"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Hudud</p>
                            <p className="text-slate-300 text-sm">O'zbekiston</p>
                        </div>
                    </div>
                  </div>

                  {/* Card Footer / Actions */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button onClick={() => navigate('/profile')} className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <User className="w-4 h-4" /> Kabinet
                    </button>
                    <button onClick={() => navigate('/darslik')} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Statistika
                    </button>
                  </div>
                </div>
              ) : (
                // NOT LOGGED IN: PROMO CARD
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 text-center">
                   <div className="w-20 h-20 bg-blue-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/40 transform rotate-3">
                      <User className="w-10 h-10 text-white" />
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-2">Shaxsiy Kabinet</h3>
                   <p className="text-slate-400 mb-6">Natijalarni saqlash va xatolarni tahlil qilish uchun tizimga kiring.</p>
                   <Link to="/auth">
                     <Button className="w-full bg-white text-slate-900 hover:bg-slate-200 font-bold h-12 rounded-xl text-base">
                        Kirish / Ro'yxatdan o'tish
                     </Button>
                   </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK ACTIONS (GRID) - Asosiy funksiyalar */}
      <section className="py-12 bg-slate-50">
        <div className="container max-w-7xl mx-auto px-4 -mt-20 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Action 1: Test */}
            <Link to="/test-ishlash" className="group">
              <div className="bg-white h-full p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-blue-500 hover:shadow-blue-500/10 transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                  <Play className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Test Ishlash</h3>
                <p className="text-slate-500 text-sm">2026-yilgi baza asosida tasodifiy 20 ta savol.</p>
              </div>
            </Link>

            {/* Action 2: Variantlar */}
            <Link to="/variant" className="group">
              <div className="bg-white h-full p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-orange-500 hover:shadow-orange-500/10 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">PRO</div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors duration-300">
                  <Zap className="w-6 h-6 text-orange-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Variantlar</h3>
                <p className="text-slate-500 text-sm">Imtihonga tushish ehtimoli yuqori bo'lgan tayyor variantlar.</p>
              </div>
            </Link>

            {/* Action 3: Mavzuli */}
            <Link to="/mavzuli" className="group">
              <div className="bg-white h-full p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-emerald-500 hover:shadow-emerald-500/10 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">PRO</div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-colors duration-300">
                  <BookOpen className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Mavzuli Test</h3>
                <p className="text-slate-500 text-sm">Mavzular bo'yicha tartiblangan maxsus savollar.</p>
              </div>
            </Link>

            {/* Action 4: Belgilar */}
            <Link to="/belgilar" className="group">
              <div className="bg-white h-full p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-purple-500 hover:shadow-purple-500/10 transition-all duration-300">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors duration-300">
                  <Car className="w-6 h-6 text-purple-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Yo'l Belgilari</h3>
                <p className="text-slate-500 text-sm">Barcha yo'l belgilarining to'liq tavsifi va qoidalari.</p>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* 3. PRO BANNER - "VIP" Uslubda */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white shadow-2xl">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] -ml-20 -mb-20"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 p-8 md:p-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-4 py-1.5 rounded-full font-bold text-sm">
                  <Crown className="w-4 h-4 fill-current" /> PREMIUM OBUNA
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
                  Imtihondan <span className="text-yellow-400">100% kafolatli</span> o'tishni istaysizmi?
                </h2>
                <ul className="space-y-4 text-slate-300">
                  <li className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-1 rounded-full"><ShieldCheck className="w-5 h-5 text-green-400" /></div>
                    <span>Videodarslar orqali qoidalarni oson o'rganish</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-1 rounded-full"><ShieldCheck className="w-5 h-5 text-green-400" /></div>
                    <span>Admin nazorati va shaxsiy tahlil</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-1 rounded-full"><ShieldCheck className="w-5 h-5 text-green-400" /></div>
                    <span>Imtihonga tushadigan eng aniq variantlar</span>
                  </li>
                </ul>
                
                <div className="pt-4">
                  {user && profile?.is_pro ? (
                     <button className="bg-slate-800 text-slate-400 cursor-default px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-500" /> Siz PRO a'zosiz
                     </button>
                  ) : (
                    <Link to="/pro">
                      <button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-900 px-10 py-4 rounded-xl font-extrabold text-lg shadow-lg shadow-orange-500/30 transform hover:-translate-y-1 transition-all">
                        PRO ga O'tish
                      </button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Decorative Image/Icon */}
              <div className="hidden md:flex flex-1 justify-center relative">
                 <div className="relative w-64 h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center justify-center transform rotate-6 hover:rotate-0 transition-all duration-500 group">
                    <Award className="w-24 h-24 text-yellow-400 mb-4 group-hover:scale-110 transition-transform" />
                    <span className="text-2xl font-bold text-white">PRO</span>
                    <span className="text-slate-400 text-sm">Avtotestu.uz</span>
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-3xl pointer-events-none"></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. STATISTIKA - Ishonch uchun */}
      <section className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-extrabold text-blue-600 mb-1">5k+</div>
              <div className="text-sm text-slate-500 font-medium">Bitiruvchilar</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-blue-600 mb-1">1000+</div>
              <div className="text-sm text-slate-500 font-medium">Testlar Bazasi</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-blue-600 mb-1">24/7</div>
              <div className="text-sm text-slate-500 font-medium">Platforma Ishlaydi</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-blue-600 mb-1">98%</div>
              <div className="text-sm text-slate-500 font-medium">O'tish Ko'rsatkichi</div>
            </div>
          </div>
        </div>
      </section>

    </MainLayout>
  );
}