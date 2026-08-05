import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Car, LogIn, Eye, EyeOff, AlertCircle, Mail, Lock, Phone,
  UserPlus, Info,
} from 'lucide-react';
import { SEO } from '@/components/SEO';
import { isNetworkError, NETWORK_ERROR_MESSAGE_UZ } from '@/lib/networkError';
import { Turnstile } from '@/components/Turnstile';
import { isTurnstileConfigured } from '@/lib/turnstile';
import {
  formatUzLocalInput,
  loginIdentifierToEmail,
  normalizeUzPhone,
  phoneToEmail,
} from '@/lib/phone';
import { useLanguage } from '@/contexts/LanguageContext';
import { z } from 'zod';

/** Yangi hisoblar uchun qat'iyroq talab (eski 6 belgili parollar kirishda ishlayveradi). */
const MIN_SIGNUP_PASSWORD = 8;

type Mode = 'login' | 'signup';
/** Kirishda qaysi ma'lumot bilan: telefon (asosiy) yoki eski email hisobi. */
type LoginBy = 'phone' | 'email';

const Auth = () => {
  const location = useLocation();

  // Pro sahifasidan "obuna olish" bosilganda darhol ro'yxatdan o'tish ochiladi
  const requestedMode = (location.state as { mode?: Mode })?.mode;
  const [mode, setMode] = useState<Mode>(requestedMode === 'signup' ? 'signup' : 'login');
  const [loginBy, setLoginBy] = useState<LoginBy>('phone');

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  // ── Rate limiting UX (UX only — real limiting is server-side) ────────────
  const [failCount, setFailCount] = useState(0);
  const [cooldownSecs, setCooldownSecs] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = (seconds: number) => {
    if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
      cooldownRef.current = null;
    }
    setCooldownSecs(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldownSecs(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const isLoginBlocked = cooldownSecs > 0;

  const { user, isLoading, signIn, signInWithGoogle } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  // Only allow same-origin paths ("/...") — blocks open redirects
  const rawReturnTo = (location.state as { returnTo?: string })?.returnTo;
  const returnTo =
    rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
      ? rawReturnTo
      : '/';

  useEffect(() => {
    if (!isLoading && user) navigate(returnTo, { replace: true });
  }, [user, isLoading, navigate, returnTo]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setTurnstileToken('');
  };

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  // ── Kirish ────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLoginBlocked) return;

    const identifier = loginBy === 'phone' ? phone : email;
    const loginEmail = loginIdentifierToEmail(identifier);

    if (!loginEmail) {
      setError(loginBy === 'phone' ? t('auth.errPhoneIncomplete') : t('auth.errEmailInvalid'));
      return;
    }
    if (!password) {
      setError(t('auth.errPasswordEmpty'));
      return;
    }

    setIsSubmitting(true);
    const { error: signInError } = await signIn(loginEmail, password);

    if (signInError) {
      if (isNetworkError(signInError)) {
        setError(NETWORK_ERROR_MESSAGE_UZ);
        setIsSubmitting(false);
        return;
      }

      const newFailCount = failCount + 1;
      setFailCount(newFailCount);

      const msg = signInError.message || '';
      if (msg.includes('Invalid login credentials')) {
        setError(loginBy === 'phone' ? t('auth.errPhoneOrPassword') : t('auth.errEmailOrPassword'));
      } else if (msg.includes('Email not confirmed')) {
        setError(t('auth.errNotConfirmed'));
      } else {
        setError(msg);
      }

      if (newFailCount >= 3 && !isLoginBlocked) startCooldown(30);
      setIsSubmitting(false);
      return;
    }

    setFailCount(0);
    setCooldownSecs(0);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setIsSubmitting(false);
    navigate(returnTo, { replace: true });
  };

  // ── Ro'yxatdan o'tish (faqat telefon raqam) ──────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalized = normalizeUzPhone(phone);
    if (!normalized) {
      setError(t('auth.errPhoneIncomplete'));
      return;
    }
    if (password.length < MIN_SIGNUP_PASSWORD) {
      setError(t('auth.errPasswordShort').replace('{min}', String(MIN_SIGNUP_PASSWORD)));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.errPasswordMismatch'));
      return;
    }
    if (isTurnstileConfigured() && !turnstileToken) {
      setError(t('auth.errTurnstile'));
      return;
    }

    setIsSubmitting(true);

    // Hisob SERVERDA yaratiladi: Turnstile va raqam formati o'sha yerda
    // qayta tekshiriladi, sun'iy manzilga tasdiqlash xati yuborilmaydi.
    let created = false;
    try {
      const { data, error: fnError } = await supabase.functions.invoke<{
        ok?: boolean;
        error?: string;
        message?: string;
      }>('phone-signup', {
        body: { phone: normalized, password, turnstileToken },
      });

      let result = data;
      if (fnError) {
        const ctx = (fnError as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          try { result = await ctx.json(); } catch { /* ignore */ }
        }
      }

      if (!result?.ok) {
        setError(result?.message ?? t('auth.errSignupFailed'));
        setTurnstileToken('');
        setIsSubmitting(false);
        return;
      }
      created = true;
    } catch {
      setError(NETWORK_ERROR_MESSAGE_UZ);
      setIsSubmitting(false);
      return;
    }

    // Hisob yaratildi — foydalanuvchi parolni qayta yozmasin, o'zimiz kiritamiz
    if (created) {
      const { error: signInError } = await signIn(phoneToEmail(normalized), password);
      setIsSubmitting(false);

      if (signInError) {
        setError(t('auth.errSignupOkLoginFailed'));
        switchMode('login');
        return;
      }
      navigate(returnTo, { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError(isNetworkError(googleError) ? NETWORK_ERROR_MESSAGE_UZ : t('auth.errGoogle'));
      setIsGoogleLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isSignup = mode === 'signup';

  /**
   * Telefon maydoni. `+998` doimiy prefiks sifatida chapda turadi —
   * foydalanuvchi faqat 9 ta raqam yozadi, mamlakat kodini har safar
   * terishi shart emas.
   */
  const phoneField = (
    <div className="space-y-1.5">
      <Label htmlFor="auth-phone" className="text-sm">{t('auth.phone')}</Label>
      <div className="flex items-stretch rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden">
        <span className="flex items-center gap-1.5 px-3 bg-muted/60 border-r border-input text-sm font-medium text-foreground select-none">
          <Phone className="w-4 h-4 text-muted-foreground" />
          +998
        </span>
        <input
          id="auth-phone"
          type="tel"
          inputMode="numeric"
          placeholder={t('auth.phonePlaceholder')}
          value={phone}
          onChange={(e) => setPhone(formatUzLocalInput(e.target.value))}
          disabled={isSubmitting}
          autoComplete="tel-national"
          maxLength={12}
          className="flex-1 h-10 px-3 bg-transparent text-base sm:text-sm font-medium outline-none placeholder:text-muted-foreground placeholder:font-normal disabled:opacity-50"
        />
      </div>
    </div>
  );


  /** Parol maydoni — ikkala rejimda ishlatiladi. */
  const passwordField = (
    <div className="space-y-1.5">
      <Label htmlFor="auth-password" className="text-sm">{t('auth.password')}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="auth-password"
          type={showPassword ? 'text' : 'password'}
          placeholder={isSignup
            ? t('auth.passwordPlaceholderNew').replace('{min}', String(MIN_SIGNUP_PASSWORD))
            : t('auth.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          className="h-10 pl-10 pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <SEO
        title={t('auth.seoTitle')}
        description={t('auth.seoDescription')}
        path="/auth"
        noIndex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-5 sm:p-6 bg-card border-border shadow-xl">

          {/* Sarlavha — faqat domen nomi, ixcham */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer min-w-0"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Car className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground truncate">Avtotestu.uz</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              {t('auth.home')}
            </button>
          </div>

          {/* Tab'lar */}
          <div className="grid grid-cols-2 gap-1 p-1 mb-4 rounded-xl bg-muted/60">
            {/*
              Faol tab siyohrang (--primary) ramka bilan ajratiladi — qaysi
              bo'limda turgani bir qarashda ko'rinsin. Nofaol tugmada ham
              `border-2 border-transparent` turadi: shundagina almashganda
              tugma o'lchami o'zgarmaydi.
            */}
            <button
              type="button"
              onClick={() => switchMode('login')}
              aria-pressed={!isSignup}
              className={`h-9 rounded-lg text-sm transition-all border-2 ${
                !isSignup
                  ? 'bg-background text-primary border-primary font-bold shadow-sm'
                  : 'border-transparent text-muted-foreground font-semibold hover:text-foreground'
              }`}
            >
              {t('auth.tabLogin')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              aria-pressed={isSignup}
              className={`h-9 rounded-lg text-sm transition-all border-2 ${
                isSignup
                  ? 'bg-background text-primary border-primary font-bold shadow-sm'
                  : 'border-transparent text-muted-foreground font-semibold hover:text-foreground'
              }`}
            >
              {t('auth.tabSignup')}
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-3">
            {!isSignup && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setLoginBy('phone'); setError(''); }}
                  className={`flex-1 h-8 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                    loginBy === 'phone'
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  {t('auth.phone')}
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginBy('email'); setError(''); }}
                  className={`flex-1 h-8 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                    loginBy === 'email'
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  {t('auth.email')}
                </button>
              </div>
            )}

            {isSignup || loginBy === 'phone' ? phoneField : (
              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-sm">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="auth-email"
                    type="email"
                    inputMode="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="email"
                    className="h-10 pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('auth.emailHint')}
                </p>
              </div>
            )}

            {passwordField}

            {isSignup && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="auth-password2" className="text-sm">{t('auth.passwordRepeat')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="auth-password2"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.passwordRepeatPlaceholder')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="new-password"
                      className="h-10 pl-10"
                    />
                  </div>
                </div>

                <p className="flex items-start gap-1.5 text-xs text-muted-foreground leading-snug">
                  <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <b className="text-foreground">{t('auth.passwordNoteStrong')}</b>{' '}
                    {t('auth.passwordNoteRest')}
                  </span>
                </p>
              </>
            )}

            {!isSignup && failCount >= 5 && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{t('auth.tooManyAttempts')}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={isSubmitting || (!isSignup && isLoginBlocked)}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isSignup ? t('auth.creating') : t('auth.checking')}
                </span>
              ) : !isSignup && isLoginBlocked ? (
                <span>{t('auth.retryIn').replace('{secs}', String(cooldownSecs))}</span>
              ) : (
                <span className="flex items-center gap-2">
                  {isSignup ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {isSignup ? t('auth.tabSignup') : t('auth.tabLogin')}
                </span>
              )}
            </Button>

          </form>

          {/*
            Parolni tiklash — hozircha SMS yo'q va telefon hisoblarining
            manzili sun'iy (@pro.com), shuning uchun tiklash xatini yubora
            olmaymiz. Yagona yo'l — administrator qo'lda o'zgartirishi.
          */}
          {!isSignup && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t('auth.resetPassword')} —{' '}
              <a
                href="https://t.me/avtotestu_ad"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                @avtotestu_ad
              </a>
            </p>
          )}

          {/*
            Google formadan KEYIN: asosiy yo'l telefon raqam bilan
            ro'yxatdan o'tish, Google esa muqobil variant sifatida pastda.
          */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-xs text-muted-foreground">{t('auth.or')}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-semibold gap-2"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isSubmitting}
          >
            {isGoogleLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                {t('auth.googleLoading')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('auth.google')}
              </>
            )}
          </Button>

          {/*
            Turnstile ENG PASTDA — Google tugmasidan ham keyin.
            Widget odatda foydalanuvchi aralashuvisiz o'zi tasdiqlanadi,
            shuning uchun pastda turishi hech narsani buzmaydi; ekran past
            bo'lsa kesiladigan narsa aynan shu bo'ladi, tugmalar emas.
          */}
          {isSignup && (
            <Turnstile
              onVerify={handleTurnstileVerify}
              action="signup"
              language={language}
              className="mt-4"
            />
          )}
        </Card>
      </div>
    </>
  );
};

export default Auth;
