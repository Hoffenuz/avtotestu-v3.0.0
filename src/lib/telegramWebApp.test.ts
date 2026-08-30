import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * ASOSIY TALAB: Telegram integratsiyasi oddiy saytga UMUMAN ta'sir
 * qilmasligi kerak — skript yuklanmasin, xato bermasin.
 */

type TgModule = typeof import('./telegramWebApp');

/**
 * Modulni HAR SAFAR toza holda yuklaydi.
 *
 * NEGA KERAK: `isTelegramWebApp()` natijani modul darajasida keshlaydi.
 * Ishlab chiqarishda bu SHART — aniqlash manbalari (URL fragmenti,
 * `window.Telegram`, `TelegramWebviewProxy`) vaqt o'tishi bilan o'zgaradi va
 * keshsiz funksiya bir xil sahifada goh `true`, goh `false` qaytarardi.
 *
 * Test esa har xil boshlang'ich holatni tekshiradi, shuning uchun modul
 * (va u bilan birga kesh) har testda qaytadan yuklanadi.
 *
 * DIQQAT: modul window holati SOZLANGANDAN KEYIN import qilinishi kerak.
 */
async function freshModule(): Promise<TgModule> {
  vi.resetModules();
  return import('./telegramWebApp');
}

function scriptCount(): number {
  return document.querySelectorAll(
    'script[src="https://telegram.org/js/telegram-web-app.js"]',
  ).length;
}

function setHref(href: string) {
  // jsdom da location ni almashtirish
  window.history.replaceState(null, '', href);
}

function resetWindow() {
  delete window.Telegram;
  delete window.TelegramWebviewProxy;
  delete window.__inTelegram;
  document.querySelectorAll('script').forEach((s) => s.remove());
}

describe('telegramWebApp — oddiy brauzerda', () => {
  beforeEach(() => {
    resetWindow();
    setHref('/');
  });

  afterEach(resetWindow);

  it('Telegram aniqlanmaydi', async () => {
    const { isTelegramWebApp } = await freshModule();
    expect(isTelegramWebApp()).toBe(false);
  });

  it('SDK skripti YUKLANMAYDI', async () => {
    const { initTelegramWebApp } = await freshModule();
    initTelegramWebApp();
    expect(scriptCount()).toBe(0);
  });

  it('oddiy hash bilan ham Telegram deb hisoblamaydi', async () => {
    setHref('/test-ishlash#natija');
    const { isTelegramWebApp, initTelegramWebApp } = await freshModule();
    expect(isTelegramWebApp()).toBe(false);
    initTelegramWebApp();
    expect(scriptCount()).toBe(0);
  });

  it('xato tashlamaydi', async () => {
    const { initTelegramWebApp } = await freshModule();
    expect(() => initTelegramWebApp()).not.toThrow();
  });
});

describe('telegramWebApp — aniqlash keshlanadi', () => {
  beforeEach(() => {
    resetWindow();
    setHref('/');
  });

  afterEach(resetWindow);

  /**
   * Bu ikki test aynan tuzatilgan xatoni qo'riqlaydi: `BottomNav` render
   * paytida `isTelegramWebApp()` ni o'qiydi va javob o'zgarib ketsa, panel
   * Telegram interfeysi ustiga chiqib qolardi.
   */
  it('fragment yo\'qolsa ham `true` bo\'lib qoladi', async () => {
    setHref('/#tgWebAppPlatform=ios');
    const { isTelegramWebApp } = await freshModule();
    expect(isTelegramWebApp()).toBe(true);

    // React Router navigatsiyasi fragmentni yo'qotadi
    setHref('/bolimlar');
    expect(isTelegramWebApp()).toBe(true);
  });

  it('oddiy brauzerda keyin SDK paydo bo\'lsa ham `false` bo\'lib qoladi', async () => {
    const { isTelegramWebApp } = await freshModule();
    expect(isTelegramWebApp()).toBe(false);

    window.Telegram = { WebApp: {} };
    expect(isTelegramWebApp()).toBe(false);
  });

  it('index.html qo\'ygan `__inTelegram` ustun turadi', async () => {
    window.__inTelegram = true;
    const { isTelegramWebApp } = await freshModule();
    expect(isTelegramWebApp()).toBe(true);
  });
});

describe('telegramWebApp — Telegram ichida', () => {
  beforeEach(resetWindow);

  afterEach(() => {
    setHref('/');
    resetWindow();
  });

  it('URL fragmentidagi tgWebAppData orqali aniqlanadi', async () => {
    setHref('/#tgWebAppData=abc&tgWebAppVersion=8.0&tgWebAppPlatform=tdesktop');
    const { isTelegramWebApp } = await freshModule();
    expect(isTelegramWebApp()).toBe(true);
  });

  it('tgWebAppPlatform orqali ham aniqlanadi', async () => {
    setHref('/#tgWebAppPlatform=android');
    const { isTelegramWebApp } = await freshModule();
    expect(isTelegramWebApp()).toBe(true);
  });

  it('mobil webview obyekti orqali aniqlanadi', async () => {
    window.TelegramWebviewProxy = {};
    const { isTelegramWebApp } = await freshModule();
    expect(isTelegramWebApp()).toBe(true);
  });

  it('aniqlanganda SDK skripti qo\'shiladi', async () => {
    setHref('/#tgWebAppPlatform=ios');
    const { initTelegramWebApp } = await freshModule();
    initTelegramWebApp();
    expect(scriptCount()).toBe(1);
  });

  it('SDK allaqachon bo\'lsa qayta yuklamaydi', async () => {
    const calls: string[] = [];
    window.Telegram = {
      WebApp: {
        ready: () => calls.push('ready'),
        expand: () => calls.push('expand'),
        isVersionAtLeast: () => false,
      },
    };
    const { initTelegramWebApp } = await freshModule();
    initTelegramWebApp();
    await Promise.resolve();
    await Promise.resolve();

    expect(scriptCount()).toBe(0);
    expect(calls).toContain('ready');
    expect(calls).toContain('expand');
  });

  it('eski Telegram versiyasida requestFullscreen chaqirilmaydi', async () => {
    const calls: string[] = [];
    window.Telegram = {
      WebApp: {
        platform: 'tdesktop',
        ready: () => calls.push('ready'),
        expand: () => calls.push('expand'),
        isVersionAtLeast: (v: string) => v === '7.0',
        requestFullscreen: () => calls.push('fullscreen'),
      },
    };
    const { initTelegramWebApp } = await freshModule();
    initTelegramWebApp();
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).not.toContain('fullscreen');
  });

  it('desktopda 8.0+ da requestFullscreen chaqiriladi', async () => {
    const calls: string[] = [];
    window.Telegram = {
      WebApp: {
        platform: 'tdesktop',
        ready: () => calls.push('ready'),
        expand: () => calls.push('expand'),
        isVersionAtLeast: () => true,
        requestFullscreen: () => calls.push('fullscreen'),
      },
    };
    const { initTelegramWebApp } = await freshModule();
    initTelegramWebApp();
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toContain('fullscreen');
  });

  it('metod xato tashlasa ham qolganlari ishlaydi', async () => {
    const calls: string[] = [];
    window.Telegram = {
      WebApp: {
        platform: 'macos',
        ready: () => { throw new Error('boom'); },
        expand: () => calls.push('expand'),
        isVersionAtLeast: () => true,
        requestFullscreen: () => calls.push('fullscreen'),
      },
    };
    const { initTelegramWebApp } = await freshModule();
    expect(() => initTelegramWebApp()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toContain('expand');
    expect(calls).toContain('fullscreen');
  });

  /**
   * Metodlar obyektdan uzilib qolmasligi kerak. Ilgari `safe(wa.expand)` deb
   * yozilgan edi va SDK ichida `this` ishlatilsa chaqiruv jimgina yiqilardi.
   */
  it('metodlar `this` bog\'lanishini yo\'qotmaydi', async () => {
    const calls: string[] = [];
    const webApp = {
      platform: 'android',
      marker: 'wa',
      ready(this: { marker?: string }) { calls.push('ready:' + this?.marker); },
      expand(this: { marker?: string }) { calls.push('expand:' + this?.marker); },
      isVersionAtLeast: () => true,
      disableVerticalSwipes(this: { marker?: string }) {
        calls.push('noSwipe:' + this?.marker);
      },
    };
    window.Telegram = { WebApp: webApp };
    const { initTelegramWebApp } = await freshModule();
    initTelegramWebApp();
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toContain('ready:wa');
    expect(calls).toContain('expand:wa');
    expect(calls).toContain('noSwipe:wa');
  });
});

/**
 * MOBIL: fullscreen kontentni status bar (soat/batareya) va Telegram'ning
 * `X` / menyu tugmalari ostiga kirgizib yuborardi. Mobilda faqat `expand()`.
 */
describe('telegramWebApp — mobil Telegram (fullscreen BO\'LMASIN)', () => {
  beforeEach(resetWindow);

  afterEach(() => {
    setHref('/');
    resetWindow();
  });

  const mobilPlatformalar = ['android', 'android_x', 'ios'];

  for (const platform of mobilPlatformalar) {
    it(`${platform}: expand ishlaydi, fullscreen chaqirilmaydi`, async () => {
      const calls: string[] = [];
      window.Telegram = {
        WebApp: {
          platform,
          ready: () => calls.push('ready'),
          expand: () => calls.push('expand'),
          // Yangi mijoz: 8.0+ qo'llab-quvvatlansa ham fullscreen kerak emas
          isVersionAtLeast: () => true,
          requestFullscreen: () => calls.push('fullscreen'),
          disableVerticalSwipes: () => calls.push('noSwipe'),
        },
      };
      const { initTelegramWebApp } = await freshModule();
      initTelegramWebApp();
      await Promise.resolve();
      await Promise.resolve();

      expect(calls).toContain('ready');
      expect(calls).toContain('expand');
      expect(calls).toContain('noSwipe');
      expect(calls).not.toContain('fullscreen');
    });
  }

  it('noma\'lum platformada fullscreen chaqirilmaydi (xavfsiz standart)', async () => {
    const calls: string[] = [];
    window.Telegram = {
      WebApp: {
        platform: 'unknown',
        ready: () => calls.push('ready'),
        expand: () => calls.push('expand'),
        isVersionAtLeast: () => true,
        requestFullscreen: () => calls.push('fullscreen'),
      },
    };
    const { initTelegramWebApp } = await freshModule();
    initTelegramWebApp();
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toContain('expand');
    expect(calls).not.toContain('fullscreen');
  });

  it('platform umuman berilmasa ham fullscreen chaqirilmaydi', async () => {
    const calls: string[] = [];
    window.Telegram = {
      WebApp: {
        ready: () => calls.push('ready'),
        expand: () => calls.push('expand'),
        isVersionAtLeast: () => true,
        requestFullscreen: () => calls.push('fullscreen'),
      },
    };
    const { initTelegramWebApp } = await freshModule();
    initTelegramWebApp();
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toContain('expand');
    expect(calls).not.toContain('fullscreen');
  });
});
