import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserValidation } from '@/hooks/useUserValidation';
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
  FileText // Yangi icon qo'shildi
} from 'lucide-react';
import { toast } from 'sonner';
import { useRegistrationAge } from '@/hooks/useRegistrationAge';

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
  const [results, setResults] = useState<TestResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Chek linkini saqlash uchun yangi state
  const [checkLink, setCheckLink] = useState<string | null>(null);

  // Validate user exists in database on page load
  useUserValidation('/auth');

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditFullName(profile.full_name || '');
    }
  }, [profile]);
// Chek ma'lumotlarini olish
useEffect(() => {
  const fetchCheck = async () => {
    if (!user?.email) return;

    try {
      // .from('chek' as any) deb yozamiz
      const { data, error } = await supabase
        .from('chek' as any) 
        .select('link')
        .eq('email', user.email)
        .maybeSingle();

      if (error) {
        console.error('Error fetching check:', error);
      } else if (data) {
        setCheckLink(data.link);
      }
    } catch (err) {
      console.error('Check fetch error:', err);
    }
  };

  fetchCheck();
}, [user]);
  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('test_results')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        if (error) {
          console.error('Error fetching results:', error);
        } else {
          setResults(data || []);
        }
      } catch (err) {
        console.error('Results fetch error:', err);
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Bekor qilish
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
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
              
              {/* YANGI QO'SHILGAN CHEK QISMI */}
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Chek
                </p>
                {checkLink && checkLink !== 'yuklanmagan' ? (
                  <a 
                    href={checkLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium flex items-center gap-1"
                  >
                    Yuklab olish
                  </a>
                ) : (
                  <p className="font-medium text-foreground">-</p>
                )}
              </div>

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
  );
};

export default Profile;