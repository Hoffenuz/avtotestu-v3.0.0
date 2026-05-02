import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';
import { useUserValidation } from '@/hooks/useUserValidation';
import { useRegistrationAge } from '@/hooks/useRegistrationAge';
import { useTrialStatus, formatTimeRemaining } from '@/hooks/useTrialStatus';
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
  AlertCircle,
  CreditCard,
  History,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  id: string;
  variant: number;
  correct_answers: number;
  total_questions: number;
  time_taken_seconds: number | null;
  completed_at: string;
}

const Profile = () => {
  const { user, profile, signOut, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const registrationDays = useRegistrationAge(user?.id);
  const trialStatus = useTrialStatus();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Chek linkini saqlash uchun yangi state
  const [checkLink, setCheckLink] = useState<string | null>(null);

  // Payment receipts state (new canonical table)
  const [paymentReceipts, setPaymentReceipts] = useState<Array<{
    id: string;
    receipt_url: string | null;
    amount: number | null;
    currency: string;
    payment_method: string | null;
    status: string;
    created_at: string;
  }>>([]);

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
// Chek ma'lumotlarini olish (legacy chek table + new payment_receipts)
useEffect(() => {
  const fetchPaymentData = async () => {
    if (!user) return;

    // Fetch from new payment_receipts table
    try {
      const { data: receipts, error: receiptsError } = await supabase
        .from('payment_receipts')
        .select('id, receipt_url, amount, currency, payment_method, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (receiptsError) {
        if (!import.meta.env.PROD) console.error('Error fetching payment receipts:', receiptsError);
      } else {
        setPaymentReceipts(receipts || []);
      }
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Payment receipts fetch error:', err);
    }

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
        .select('id, plan_name, tariff_days, amount, currency, started_at, ends_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        if (!import.meta.env.PROD) console.error('Error fetching subscriptions:', error);
      } else {
        setSubscriptions(data || []);
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
          .select('id, variant, correct_answers, total_questions, time_taken_seconds, completed_at')
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
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
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Group results by variant and get best score for each
  const bestResultsByVariant = results.reduce((acc, result) => {
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

  if (!user) return null;

  const displayName = profile?.full_name || profile?.username || 'Foydalanuvchi';

  return (
    <>
    <SEO
      title="Profilim"
      description="Avtotestu.uz foydalanuvchi profili."
      path="/profile"
      noIndex={true}
    />
    <div className="min-h-screen bg-background">
      {/* Header with User Name */}
      <header className="bg-primary text-primary-foreground px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
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
              className="bg-white text-black border-white hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Chiqish
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
              <p className="text-primary-foreground/80 text-sm md:text-base">{user.email || user.phone}</p>
              {profile?.username && profile?.full_name && (
                <p className="text-primary-foreground/60 text-sm">@{profile.username}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 -mt-4">
        {/* Trial Timer - Large Main Element */}
        {trialStatus.isTrialActive && !trialStatus.isPro && (
          <Card className="p-6 mb-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Sinov muddati</h3>
                  <p className="text-sm text-muted-foreground">PRO funksiyalar uchun</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-amber-600">
                  {formatTimeRemaining(trialStatus.timeRemaining)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">qoldi</p>
              </div>
            </div>
          </Card>
        )}

        {/* Trial Expired Warning */}
        {trialStatus.isTrialUsed && !trialStatus.isTrialActive && !trialStatus.isPro && (
          <Card className="p-6 mb-6 bg-destructive/10 border-2 border-destructive/30">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-12 h-12 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">Sinov muddati tugadi</h3>
                <p className="text-sm text-muted-foreground mb-3">PRO funksiyalardan foydalanish uchun obuna sotib oling</p>
                <Button size="sm" onClick={() => navigate('/pro')} className="bg-amber-500 hover:bg-amber-600">
                  PRO obuna olish
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Profile Edit Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
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
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1 min-w-[100px]"
                >
                  <X className="w-4 h-4 mr-2" />
                  Bekor qilish
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 min-w-[100px]"
                >
                  {isSaving ? (
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Saqlash
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">To'liq ism</p>
                <p className="font-medium text-foreground">{profile?.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Foydalanuvchi nomi</p>
                <p className="font-medium text-foreground">{profile?.username ? `@${profile.username}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium text-foreground">{user.phone || '-'}</p>
              </div>
              
              {/* Chek (legacy) */}
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
                    className="text-primary hover:underline font-medium flex items-center gap-1"
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
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{results.length}</div>
            <p className="text-xs text-muted-foreground">Jami testlar</p>
          </Card>
          <Card className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{sortedVariants.length}</div>
            <p className="text-xs text-muted-foreground">Variantlar</p>
          </Card>
          <Card className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {results.reduce((sum, r) => sum + r.correct_answers, 0)}
            </div>
            <p className="text-xs text-muted-foreground">To'g'ri javoblar</p>
          </Card>
          <Card className="p-4 text-center">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {results.reduce((sum, r) => sum + (r.total_questions - r.correct_answers), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Noto'g'ri javoblar</p>
          </Card>
        </div>

        {/* Payment Receipts */}
        {paymentReceipts.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              To'lov cheklari
            </h2>
            <div className="space-y-3">
              {paymentReceipts.map((receipt) => (
                <div key={receipt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        receipt.status === 'approved'
                          ? 'bg-green-500/20 text-green-700'
                          : receipt.status === 'rejected'
                          ? 'bg-red-500/20 text-red-700'
                          : 'bg-amber-500/20 text-amber-700'
                      }`}>
                        {receipt.status === 'approved' ? 'Tasdiqlangan' : receipt.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
                      </span>
                      {receipt.payment_method && (
                        <span className="text-xs text-muted-foreground">{receipt.payment_method}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(receipt.created_at).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {receipt.amount && (
                      <span className="text-sm font-medium">
                        {receipt.amount.toLocaleString()} {receipt.currency}
                      </span>
                    )}
                    {receipt.receipt_url && (
                      <a
                        href={receipt.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

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

        {/* Results by Variant */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Variant bo'yicha eng yaxshi natijalar
          </h2>

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
                const passed = score >= 80;

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
        </Card>
      </main>
    </div>
    </>
  );
};

export default Profile;