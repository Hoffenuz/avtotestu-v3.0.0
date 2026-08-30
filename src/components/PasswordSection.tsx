/**
 * PasswordSection — "Profil ma'lumotlari" kartasi ichidagi ixcham parol bo'limi.
 *
 * Yopiq holatda bitta tugma, bosilganda forma ochiladi — shuning uchun desktopda
 * profil kartasini cho'zib yubormaydi.
 *
 * Ikki holat:
 *  1. Google orqali kirgan (paroli yo'q) — "parol o'rnatish", eski parol so'ralmaydi.
 *  2. Paroli bor — "parolni o'zgartirish", eski parol tasdiqlanadi.
 *
 * Xavfsizlik: `updateUser` joriy sessiya egasiga amal qiladi — foydalanuvchi
 * faqat O'Z parolini o'zgartira oladi.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

/** Supabase minimumi 6 — yangi parollar uchun qat'iyroq talab. */
const MIN_PASSWORD_LENGTH = 8;

export function PasswordSection() {
  const { hasPasswordLogin, updatePassword } = useAuth();

  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const label = hasPasswordLogin ? "Parolni o'zgartirish" : "Parol o'rnatish";

  const closeAndReset = () => {
    setOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswords(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (hasPasswordLogin && !currentPassword) {
      setError('Joriy parolni kiriting.');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Yangi parol kamida ${MIN_PASSWORD_LENGTH} ta belgi bo'lishi kerak.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Parollar mos kelmadi.');
      return;
    }
    if (hasPasswordLogin && newPassword === currentPassword) {
      setError('Yangi parol eskisidan farq qilishi kerak.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await updatePassword(
      newPassword,
      hasPasswordLogin ? currentPassword : undefined,
    );
    setSubmitting(false);

    if (updateError) {
      switch (updateError.message) {
        case 'wrong_current_password':
          setError("Joriy parol noto'g'ri.");
          break;
        case 'current_password_required':
          setError('Joriy parolni kiriting.');
          break;
        case 'not_authenticated':
          setError('Sessiya tugagan. Sahifani yangilab, qayta kiring.');
          break;
        case 'timeout':
          setError("Server javob bermadi. Qayta urinib ko'ring.");
          break;
        default:
          setError(updateError.message || 'Xatolik yuz berdi.');
      }
      return;
    }

    toast.success(
      hasPasswordLogin
        ? 'Parol yangilandi!'
        : "Parol o'rnatildi! Endi email va parol bilan ham kira olasiz.",
    );
    closeAndReset();
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">{label}</span>
          </span>
          <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
        </button>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={closeAndReset}
            className="w-full flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">{label}</span>
            </span>
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </button>

          {!hasPasswordLogin && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Siz Google orqali kirgansiz. Parol o'rnatsangiz, keyinchalik Google bilan
              ham, email va parol bilan ham kira olasiz.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5">
            {hasPasswordLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="current-password" className="text-xs">Joriy parol</Label>
                <Input
                  id="current-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="current-password"
                  className="h-9"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs">Yangi parol</Label>
              <Input
                id="new-password"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting}
                autoComplete="new-password"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs">Parolni tasdiqlang</Label>
              <Input
                id="confirm-password"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                autoComplete="new-password"
                className="h-9"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {showPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPasswords ? 'Yashirish' : "Ko'rsatish"}
              </button>
              <span className="text-xs text-muted-foreground">
                Kamida {MIN_PASSWORD_LENGTH} ta belgi
              </span>
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-2.5 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-0.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={closeAndReset}
                disabled={submitting}
              >
                Bekor qilish
              </Button>
              <Button type="submit" size="sm" className="flex-1 h-9 gap-1.5" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Saqlash
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
