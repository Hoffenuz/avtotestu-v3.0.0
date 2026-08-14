import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';
import { useUserValidation } from '@/hooks/useUserValidation';
import { useRegistrationAge } from '@/hooks/useRegistrationAge';
import { useAccessState } from '@/hooks/useAccessState';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  LogOut,
  Trophy,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  Edit2,
  Save,
  X,
  Calendar,
  FileText,
  History,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { DeviceLicenseCard } from '@/components/DeviceLicenseCard';
import { PasswordSection } from '@/components/PasswordSection';
import { emailToPhoneDisplay } from '@/lib/phone';
import { formatTestTime } from '@/lib/testPersistence';

interface TestResult {
  id: string;
  variant: number;
  correct_answers: number;
  total_questions: number;
  time_taken_seconds: number | null;
  completed_at: string;
  question_source?: string | null;
}

/** Exam tickets (v1–v63). Mavzuli/practice banklarini "Variant N" deb ko'rsatmaymiz. */
function isExamTicketResult(r: TestResult): boolean {
  if (r.variant < 1 || r.variant > 63) return false;
  const src = (r.question_source || '').trim();
  if (/^v\d+\.json$/i.test(src)) return true;
  // Legacy + session-siz saqlangan 20 savollik variantlar
  if ((!src || src === 'free') && r.total_questions === 20) return true;
  if (src.startsWith('t') || /mavzuli/i.test(src)) return false;
  // '600.json'/'barcha*' — legacy nom; 'free-*'/'barcha-*' — joriy erkin test fayllari
  if (src === '600.json' || src.startsWith('barcha') || src.startsWith('free-')) return false;
  return false;
}

const Profile = () => {
  const { user, profile, signOut, isLoading, refreshProfile } = useAuth();

  /** Telefon orqali ochilgan hisobda sun'iy email o'rniga raqam ko'rsatiladi. */
  const phoneFromEmail = emailToPhoneDisplay(user?.email);
  const navigate = useNavigate();
  const registrationDays = useRegistrationAge();
  const { isPremium, expiresAt: subscriptionExpiresAt, refresh: refreshAccessState } = useAccessState();
  const paymePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [resultsExpanded, setResultsExpanded] = useState(true);
  
  // Chek linkini saqlash uchun yangi state
  const [checkLink, setCheckLink] = useState<string | null>(null);

  // Subscriptions history state
  const [subscriptions, setSubscriptions] = useState<Array<{
    id: string;
    plan_name: string | null;
    tariff_days: number;
    amount: number | null;
    currency: string;
    started_at: string;
    ends_at: string;
  }>>([]);

  // Validate user exists in database on page load (handles redirect to /auth)
  useUserValidation('/auth');

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditFullName(profile.full_name || '');
    }
  }, [profile]);

  /**
   * Payme'dan qaytgach (?from=payme) PRO holati darhol ko'rinmasligi mumkin:
   * Payme'ning bizga server-server tasdiq chaqiruvi va foydalanuvchi
   * brauzerining shu sahifaga qaytishi parallel ketadi — bittasi ikkinchisidan
   * oldin yetib kelishi mumkin. Shu sabab bir martalik tekshiruv yetarli emas:
   * PRO tasdiqlanguncha (yoki ~20s tugaguncha) bir necha marta qayta so'raymiz.
   */
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') !== 'payme') return;

    // Sahifa yangilansa/orqaga qaytilsa qayta ishga tushmasin.
    window.history.replaceState(null, '', window.location.pathname);

    if (isPremium) return;

    toast.info("To'lov tasdiqlanmoqda, biroz kuting...");
    let attempts = 0;
    const maxAttempts = 8; // ~20s (2.5s oralig'ida)
    paymePollRef.current = setInterval(() => {
      attempts += 1;
      if (attempts > maxAttempts) {
        if (paymePollRef.current) clearInterval(paymePollRef.current);
        paymePollRef.current = null;

        /**
         * Bu yerga yetib kelish = 20 soniyada ham PRO tasdiqlanmadi.
         * JIMGINA to'xtab qolmaymiz: foydalanuvchi pulini to'lagan va
         * nima qilishini bilishi shart, aks holda "pulim ketdi" degan
         * xavotirda qoladi.
         */
        toast.error(
          "To'lov tasdig'i kechikmoqda. Sahifani yangilang — o'zgarmasa " +
            "Telegram orqali bog'laning: @avtotestu_ad",
          { duration: 15000 },
        );
        return;
      }
      void refreshAccessState();
    }, 2500);

    return () => {
      if (paymePollRef.current) clearInterval(paymePollRef.current);
      paymePollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /** PRO tasdiqlangan zahoti pollingni to'xtatamiz. */
  useEffect(() => {
    if (isPremium && paymePollRef.current) {
      clearInterval(paymePollRef.current);
      paymePollRef.current = null;
      toast.success("PRO tarif faollashtirildi!");
    }
  }, [isPremium]);
// Eski (legacy) chek havolasini olish.
// To'lov cheklari ro'yxati ko'rsatilmaydi — chekni foydalanuvchi Payme ilovasidan
// oladi. Bazada yozuv baribir saqlanadi (audit va admin uchun).
useEffect(() => {
  const fetchPaymentData = async () => {
    if (!user) return;

    // Fetch from legacy chek table (email-based)
    if (user.email) {
      try {
        const { data, error } = await (supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 'chek' table not in generated types
          .from('chek' as any)
          .select('link')
          .eq('email', user.email)
          .maybeSingle() as unknown as Promise<{ data: { link: string } | null; error: { message: string } | null }>);

        if (error) {
          if (!import.meta.env.PROD) console.error('Error fetching check:', error);
        } else if (data?.link) {
          setCheckLink(data.link);
        }
      } catch (err) {
        if (!import.meta.env.PROD) console.error('Check fetch error:', err);
      }
    }
  };

  fetchPaymentData();
}, [user]);

// Subscriptions history
useEffect(() => {
  const fetchSubscriptions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, plan_name, tariff_days, amount, currency, started_at, ends_at, is_trial')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) {
        if (!import.meta.env.PROD) console.error('Error fetching subscriptions:', error);
      } else {
        // Trial o'chirilgan — tarixda trial yozuvlarini ko'rsatmaymiz
        const paidOnly = (data || []).filter(
          (sub) => !sub.is_trial && (sub.plan_name || '').toLowerCase() !== 'trial'
        );
        setSubscriptions(paidOnly.slice(0, 10));
      }
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Subscriptions fetch error:', err);
    }
  };

  fetchSubscriptions();
}, [user]);
  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('test_results')
          .select('id, variant, correct_answers, total_questions, time_taken_seconds, completed_at, question_source')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(100);

        if (error) {
          if (!import.meta.env.PROD) console.error('Error fetching results:', error);
        } else {
          setResults(data || []);
        }
      } catch (err) {
        if (!import.meta.env.PROD) console.error('Results fetch error:', err);
      } finally {
        setLoadingResults(false);
      }
    };

    fetchResults();
  }, [user]);

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      navigate('/auth', { replace: true });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editUsername.trim() || null,
          full_name: editFullName.trim() || null,
        })
        .eq('id', user.id);

      if (error) {
        toast.error('Profil yangilanmadi: ' + error.message);
      } else {
        toast.success('Profil muvaffaqiyatli yangilandi');
        await refreshProfile();
        setIsEditing(false);
      }
    } catch (err) {
      toast.error('Xatolik yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditUsername(profile?.username || '');
    setEditFullName(profile?.full_name || '');
    setIsEditing(false);
  };

  const formatTime = (seconds: number | null) => {
    if (seconds == null) return '--:--';
    return formatTestTime(seconds);
  };

  // Exam tickets only — mavzuli/practice must not collide with "Variant N"
  const examResults = results.filter(isExamTicketResult);

  // Group results by variant and get best score for each
  const bestResultsByVariant = examResults.reduce((acc, result) => {
    const existing = acc[result.variant];
    if (!existing || result.correct_answers > existing.correct_answers) {
      acc[result.variant] = result;
    }
    return acc;
  }, {} as Record<number, TestResult>);

  const sortedVariants = Object.keys(bestResultsByVariant)
    .map(Number)
    .sort((a, b) => a - b);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  /**
   * `return null` EMAS — u OQ EKRAN berardi.
   *
   * AuthContext sekin tarmoqda getSession() ni 3.5 s da timeout qilib
   * `isLoading` ni false qiladi, sessiya esa keyinroq INITIAL_SESSION bilan
   * keladi. O'sha oraliqda `user` hali null: useUserValidation ataylab
   * /auth ga yubormaydi (haqiqiy foydalanuvchini chiqarib yubormaslik uchun),
   * lekin bu yer null qaytarib butunlay bo'sh sahifa ko'rsatardi.
   * Spinner: sessiya kelsa profil ochiladi, haqiqiy mehmon bo'lsa
   * useUserValidation /auth ga yo'naltiradi.
   */
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = profile?.full_name || profile?.username || 'Foydalanuvchi';

  return (
    <>
    <SEO
      title="Profilim"
      description="Avtotestlar.uz foydalanuvchi profili."
      path="/profile"
      noIndex={true}
    />
    <div className="min-h-screen bg-background">
      {/* Header with User Name */}
      <header className="bg-primary text-primary-foreground px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Orqaga
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
              className="bg-white text-black border-white hover:bg-gray-100 disabled:opacity-70"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {signingOut ? 'Chiqilmoqda…' : 'Chiqish'}
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
              <p className="text-primary-foreground/80 text-sm md:text-base">
                {phoneFromEmail ?? user.email ?? user.phone}
              </p>
              {profile?.username && profile?.full_name && (
                <p className="text-primary-foreground/60 text-sm">@{profile.username}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 -mt-4">
        {/* Profil ma'lumotlari + Natijalar — yonma-yon */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profil ma'lumotlari
              </h2>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Tahrirlash
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">To'liq ism</Label>
                  <Input
                    id="fullName"
                    placeholder="Ismingizni kiriting"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Foydalanuvchi nomi</Label>
                  <Input
                    id="username"
                    placeholder="@username"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">To'liq ism</p>
                  <p className="font-medium text-foreground">{profile?.full_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Foydalanuvchi nomi</p>
                  <p className="font-medium text-foreground">{profile?.username ? `@${profile.username}` : '-'}</p>
                </div>
                {/*
                  Telefon orqali ro'yxatdan o'tganlarda email sun'iy
                  (998XXXXXXXXX@pro.com) — uni ko'rsatish chalg'itadi,
                  shuning uchun o'rniga raqamning o'zi chiqadi.
                */}
                {phoneFromEmail ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon raqam</p>
                    <p className="font-medium text-foreground">{phoneFromEmail}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground break-all">{user.email || '-'}</p>
                  </div>
                )}
                {checkLink && checkLink !== 'yuklanmagan' && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Chek (eski)
                    </p>
                    <a
                      href={checkLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium flex items-center gap-1 text-sm"
                    >
                      Yuklab olish <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Ro'yxatdan o'tgan
                  </p>
                  <p className="font-medium text-foreground">
                    {registrationDays !== null ? `${registrationDays} kun` : '-'}
                  </p>
                </div>
              </div>
            )}

            {/* Parol — tahrirlash rejimida emas, ma'lumotlar ostida ixcham bo'lim */}
            {!isEditing && <PasswordSection />}
          </Card>

          <Card className="p-6 h-full">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Natijalar
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-center">
                <Trophy className="w-5 h-5 text-primary mx-auto mb-1.5" />
                <div className="text-2xl font-bold text-foreground">{examResults.length}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Jami testlar</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-center">
                <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1.5" />
                <div className="text-2xl font-bold text-foreground">{sortedVariants.length}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Variantlar</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-center">
                <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1.5" />
                <div className="text-2xl font-bold text-foreground">
                  {examResults.reduce((sum, r) => sum + r.correct_answers, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">To'g'ri javoblar</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-center">
                <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1.5" />
                <div className="text-2xl font-bold text-foreground">
                  {examResults.reduce((sum, r) => sum + (r.total_questions - r.correct_answers), 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Noto'g'ri javoblar</p>
              </div>
            </div>
          </Card>
        </div>

        <DeviceLicenseCard
          isPremium={isPremium}
          subscriptionExpiresAt={subscriptionExpiresAt}
          className="mb-6"
        />

        {/* Subscriptions History */}
        {subscriptions.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Obuna tarixi
            </h2>
            <div className="space-y-3">
              {subscriptions.map((sub) => {
                const isActive = new Date(sub.ends_at) > new Date();
                return (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-green-500/20 text-green-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {isActive ? 'Faol' : 'Tugagan'}
                        </span>
                        <span className="text-sm font-medium">
                          {sub.plan_name || `${sub.tariff_days} kun`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(sub.started_at).toLocaleDateString('uz-UZ')} – {new Date(sub.ends_at).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                    {sub.amount && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {sub.amount.toLocaleString()} {sub.currency}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Variant bo'yicha test natijalari — yig'iladigan */}
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setResultsExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-3 p-6 text-left hover:bg-muted/30 transition-colors"
            aria-expanded={resultsExpanded}
          >
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Variant bo'yicha eng yaxshi natijalar
              {sortedVariants.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({sortedVariants.length})
                </span>
              )}
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                resultsExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {resultsExpanded && (
          <div className="px-6 pb-6 pt-0 border-t border-border">
          {loadingResults ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : sortedVariants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Hali test natijalaringiz yo'q</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/')}
              >
                Testni boshlash
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedVariants.map((variant) => {
                const result = bestResultsByVariant[variant];
                const score = Math.round((result.correct_answers / result.total_questions) * 100);
                const passed = score >= 90;

                return (
                  <div
                    key={variant}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        passed ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        <span className={`text-sm font-bold ${
                          passed ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {variant}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Variant {variant}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(result.time_taken_seconds)}
                          </span>
                          <span>
                            {new Date(result.completed_at).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        passed ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {result.correct_answers} / {result.total_questions}
                      </div>
                      <div className={`text-sm ${
                        passed ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {score}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
          )}
        </Card>
      </main>
    </div>
    </>
  );
};

export default Profile;