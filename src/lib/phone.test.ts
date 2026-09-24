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
  formatLoginInput,
  formatUzPhoneDisplay,
  formatUzPhoneLoose,
  isPhoneEmail,
  loginIdentifierToEmail,
  looksLikePhone,
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

describe('formatUzPhoneLoose', () => {
  it('998 siz yozilganda darhol guruhlaydi', () => {
    expect(formatUzPhoneLoose('')).toBe('');
    expect(formatUzPhoneLoose('90')).toBe('90');
    expect(formatUzPhoneLoose('90123')).toBe('90 123');
    expect(formatUzPhoneLoose('901234567')).toBe('90 123 45 67');
  });

  it("to'liq raqamdan mamlakat kodini ajratadi", () => {
    expect(formatUzPhoneLoose('998901234567')).toBe('+998 90 123 45 67');
    expect(formatUzPhoneLoose('+998901234567')).toBe('+998 90 123 45 67');
    expect(formatUzPhoneLoose('+998 90 123 45 67')).toBe('+998 90 123 45 67');
  });

  it("`+` bilan yozayotganda kod aniq bo'lgunicha tegmaydi", () => {
    expect(formatUzPhoneLoose('+')).toBe('+');
    expect(formatUzPhoneLoose('+998')).toBe('+998');
    expect(formatUzPhoneLoose('+99890')).toBe('+99890');
    // 10-xonada kod aniq bo'ladi va chiroyli shaklga o'tadi
    expect(formatUzPhoneLoose('+9989012345')).toBe('+998 90 123 45');
  });

  it("REGRESSIYA: 99 operator kodli 998... raqamni buzmaydi", () => {
    // 99 812 34 56 — haqiqiy raqam. Eski kod undan "998" ni kesib
    // tashlar edi va egasi ro'yxatdan o'ta olmasdi.
    expect(formatUzPhoneLoose('998123456')).toBe('99 812 34 56');
    expect(normalizeUzPhone(formatUzPhoneLoose('998123456'))).toBe('998998123456');
  });

  it('ortiqcha raqamni kesadi', () => {
    // Mamlakat kodi yo'q (998 bilan boshlanmaydi) — birinchi 9 xona olinadi
    expect(formatUzPhoneLoose('9012345678999')).toBe('90 123 45 67');
    expect(formatUzPhoneLoose('99890123456789')).toBe('+998 90 123 45 67');
  });

  it('natijasi normalizatsiyadan muvaffaqiyatli o\'tadi', () => {
    expect(normalizeUzPhone(formatUzPhoneLoose('901234567'))).toBe('998901234567');
    expect(normalizeUzPhone(formatUzPhoneLoose('998901234567'))).toBe('998901234567');
  });
});

describe('formatLoginInput', () => {
  it('telefonni formatlaydi', () => {
    expect(formatLoginInput('901234567')).toBe('90 123 45 67');
    expect(formatLoginInput('+998901234567')).toBe('+998 90 123 45 67');
  });

  it('emailga tegmaydi', () => {
    expect(formatLoginInput('user@gmail.com')).toBe('user@gmail.com');
    expect(formatLoginInput('07amir@mail.ru')).toBe('07amir@mail.ru');
    expect(formatLoginInput('  user@gmail.com')).toBe('user@gmail.com');
  });

  it('telefonmi yoki emailmi — to\'g\'ri ajratadi', () => {
    expect(looksLikePhone('+998 90 123 45 67')).toBe(true);
    expect(looksLikePhone('901234567')).toBe(true);
    expect(looksLikePhone('user@gmail.com')).toBe(false);
    expect(looksLikePhone('')).toBe(false);
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
