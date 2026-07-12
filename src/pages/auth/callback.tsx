import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';

/** How long to wait for the OAuth code exchange before giving up (ms) */
const OAUTH_GRACE_PERIOD_MS = 8000;

const AuthCallback = () => {
  const navigate = useNavigate();
  const { isLoading, user } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      // User successfully authenticated via OAuth
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      navigate('/', { replace: true });
      return;
    }

    // OAuth provider reported an explicit error — no point waiting
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (params.get('error') || hashParams.get('error')) {
      navigate('/auth', { replace: true });
      return;
    }

    // No user YET — the URL code exchange (detectSessionInUrl) may still be
    // in flight even though getSession() already resolved. Wait a grace
    // period for the SIGNED_IN event instead of bouncing to /auth too early.
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        navigate('/auth', { replace: true });
      }, OAUTH_GRACE_PERIOD_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, user, navigate]);

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
