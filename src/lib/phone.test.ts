/**
 * phone.ts — telefon raqamni login sifatida ishlatish testlari.
 *
 * Bu mantiq buzilsa foydalanuvchi o'z hisobiga KIRA OLMAY qoladi (raqamdan
 * boshqa manzil hosil bo'ladi), lekin build ham, lint ham xato bermaydi —
 * shuning uchun testlar shart.
 */
import { describe, expect, it } from 'vitest';
import {
  emailToPhoneDisplay,
  formatUzLocalInput,
  formatUzPhoneDisplay,
  formatUzPhoneInput,
  isPhoneEmail,
  loginIdentifierToEmail,
  normalizeUzPhone,
  phoneToEmail,
} from './phone';

describe('normalizeUzPhone', () => {
  it('turli shakllarni bir xil natijaga keltiradi', () => {
    const kutilgan = '998901234567';
    expect(normalizeUzPhone('901234567')).toBe(kutilgan);
    expect(normalizeUzPhone('998901234567')).toBe(kutilgan);
    expect(normalizeUzPhone('+998901234567')).toBe(kutilgan);
    expect(normalizeUzPhone('+998 90 123 45 67')).toBe(kutilgan);
    expect(normalizeUzPhone('  +998-90-123-45-67  ')).toBe(kutilgan);
  });

  it("noto'g'ri raqamlarni rad etadi", () => {
    expect(normalizeUzPhone('')).toBeNull();
    expect(normalizeUzPhone('123')).toBeNull();
    expect(normalizeUzPhone('12345678')).toBeNull();        // 8 xona
    expect(normalizeUzPhone('9012345678')).toBeNull();      // 10 xona
    expect(normalizeUzPhone('997901234567')).toBeNull();    // boshqa davlat kodi
    expect(normalizeUzPhone('001234567')).toBeNull();       // operator kodi 0 bilan
    expect(normalizeUzPhone('101234567')).toBeNull();       // operator kodi 1 bilan
  });
});

describe('formatUzPhoneInput', () => {
  it('yozilayotganda bosqichma-bosqich formatlaydi', () => {
    expect(formatUzPhoneInput('')).toBe('');
    expect(formatUzPhoneInput('90')).toBe('+998 90');
    expect(formatUzPhoneInput('90123')).toBe('+998 90 123');
    expect(formatUzPhoneInput('901234567')).toBe('+998 90 123 45 67');
  });

  it('998 ni ikki marta qo\'shmaydi va ortiqcha raqamni kesadi', () => {
    expect(formatUzPhoneInput('998901234567')).toBe('+998 90 123 45 67');
    expect(formatUzPhoneInput('+998901234567')).toBe('+998 90 123 45 67');
    expect(formatUzPhoneInput('9012345678999')).toBe('+998 90 123 45 67');
  });
});

describe('formatUzLocalInput', () => {
  it("+998 prefiksisiz formatlaydi (maydonda prefiks alohida turadi)", () => {
    expect(formatUzLocalInput('')).toBe('');
    expect(formatUzLocalInput('90')).toBe('90');
    expect(formatUzLocalInput('90123')).toBe('90 123');
    expect(formatUzLocalInput('901234567')).toBe('90 123 45 67');
  });

  it("to'liq raqam nusxa ko'chirilsa 998 ni kesib tashlaydi", () => {
    expect(formatUzLocalInput('998901234567')).toBe('90 123 45 67');
    expect(formatUzLocalInput('+998 90 123 45 67')).toBe('90 123 45 67');
  });

  it('ortiqcha raqamni qabul qilmaydi', () => {
    expect(formatUzLocalInput('9012345678999')).toBe('90 123 45 67');
  });

  it('natijasi normalizatsiyadan muvaffaqiyatli o\'tadi', () => {
    expect(normalizeUzPhone(formatUzLocalInput('901234567'))).toBe('998901234567');
  });
});

describe('sun\'iy manzil', () => {
  it('raqamdan manzil yasaydi va qaytarib o\'qiydi', () => {
    const email = phoneToEmail('998901234567');
    expect(email).toBe('998901234567@pro.com');
    expect(isPhoneEmail(email)).toBe(true);
    expect(emailToPhoneDisplay(email)).toBe('+998 90 123 45 67');
  });

  it('oddiy email telefon hisobi deb hisoblanmaydi', () => {
    expect(isPhoneEmail('user@gmail.com')).toBe(false);
    expect(isPhoneEmail(null)).toBe(false);
    expect(isPhoneEmail(undefined)).toBe(false);
    expect(emailToPhoneDisplay('user@gmail.com')).toBeNull();
  });

  it('ko\'rsatish formati', () => {
    expect(formatUzPhoneDisplay('998901234567')).toBe('+998 90 123 45 67');
  });
});

describe('loginIdentifierToEmail', () => {
  it('telefon raqamni sun\'iy manzilga aylantiradi', () => {
    expect(loginIdentifierToEmail('901234567')).toBe('998901234567@pro.com');
    expect(loginIdentifierToEmail('+998 90 123 45 67')).toBe('998901234567@pro.com');
  });

  it('eski email hisoblarini o\'zgartirmaydi (faqat kichik harf)', () => {
    expect(loginIdentifierToEmail('user@gmail.com')).toBe('user@gmail.com');
    expect(loginIdentifierToEmail('  User@Gmail.COM ')).toBe('user@gmail.com');
  });

  it('bo\'sh yoki buzuq qiymatga null qaytaradi', () => {
    expect(loginIdentifierToEmail('')).toBeNull();
    expect(loginIdentifierToEmail('   ')).toBeNull();
    expect(loginIdentifierToEmail('123')).toBeNull();
  });
});
