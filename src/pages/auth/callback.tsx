import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';
import { peekPendingPlan } from '@/lib/pendingPlan';

/** Slow mobile / CF — detectSessionInUrl exchange tugaguncha kutamiz */
const OAUTH_GRACE_PERIOD_MS = 45_000;

const AuthCallback = () => {
  const navigate = useNavigate();
  const { isLoading, user } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Google orqali kirish to'liq sahifa yangilanishi bilan qaytadi, shuning
      // uchun tanlangan tarif faqat sessionStorage da omon qoladi. Bor bo'lsa
      // foydalanuvchini bosh sahifaga emas, to'lovni davom ettiradigan joyga
      // qaytaramiz.
      navigate(peekPendingPlan() ? '/pro' : '/', { replace: true });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (params.get('error') || hashParams.get('error')) {
      navigate('/auth', { replace: true });
      return;
    }

    // Code exchange still in flight — do not bounce early
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        navigate('/auth', { replace: true });
      }, OAUTH_GRACE_PERIOD_MS);
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return (
    <>
    <SEO
      title="Autentifikatsiya"
      description="Avtotestlar.uz autentifikatsiya jarayoni."
      path="/auth/callback"
      noIndex={true}
    />
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #e5e7eb',
        borderTopColor: '#1e3a8a',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    </>
  );
};

export default AuthCallback;
