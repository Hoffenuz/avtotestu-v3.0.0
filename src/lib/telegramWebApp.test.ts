import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isTelegramWebApp, initTelegramWebApp } from './telegramWebApp';

/**
 * ASOSIY TALAB: Telegram integratsiyasi oddiy saytga UMUMAN ta'sir
 * qilmasligi kerak — skript yuklanmasin, xato bermasin.
 */

function scriptCount(): number {
  return document.querySelectorAll(
    'script[src="https://telegram.org/js/telegram-web-app.js"]',
  ).length;
}

function setHref(href: string) {
  // jsdom da location ni almashtirish
  window.history.replaceState(null, '', href);
}

describe('telegramWebApp — oddiy brauzerda', () => {
  beforeEach(() => {
    delete window.Telegram;
    delete window.TelegramWebviewProxy;
    setHref('/');
    document.querySelectorAll('script').forEach((s) => s.remove());
  });

  afterEach(() => {
    document.querySelectorAll('script').forEach((s) => s.remove());
  });

  it('Telegram aniqlanmaydi', () => {
    expect(isTelegramWebApp()).toBe(false);
  });

  it('SDK skripti YUKLANMAYDI', () => {
    initTelegramWebApp();
    expect(scriptCount()).toBe(0);
  });

  it('oddiy hash bilan ham Telegram deb hisoblamaydi', () => {
    setHref('/test-ishlash#natija');
    expect(isTelegramWebApp()).toBe(false);
    initTelegramWebApp();
    expect(scriptCount()).toBe(0);
  });

  it('xato tashlamaydi', () => {
    expect(() => initTelegramWebApp()).not.toThrow();
  });
});

describe('telegramWebApp — Telegram ichida', () => {
  beforeEach(() => {
    delete window.Telegram;
    delete window.TelegramWebviewProxy;
    document.querySelectorAll('script').forEach((s) => s.remove());
  });

  afterEach(() => {
    setHref('/');
    delete window.Telegram;
    delete window.TelegramWebviewProxy;
    document.querySelectorAll('script').forEach((s) => s.remove());
  });

  it('URL fragmentidagi tgWebAppData orqali aniqlanadi', () => {
    setHref('/#tgWebAppData=abc&tgWebAppVersion=8.0&tgWebAppPlatform=tdesktop');
    expect(isTelegramWebApp()).toBe(true);
  });

  it('tgWebAppPlatform orqali ham aniqlanadi', () => {
    setHref('/#tgWebAppPlatform=android');
    expect(isTelegramWebApp()).toBe(true);
  });

  it('mobil webview obyekti orqali aniqlanadi', () => {
    window.TelegramWebviewProxy = {};
    expect(isTelegramWebApp()).toBe(true);
  });

  it('aniqlanganda SDK skripti qo\'shiladi', () => {
    setHref('/#tgWebAppPlatform=ios');
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
    expect(() => initTelegramWebApp()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toContain('expand');
    expect(calls).toContain('fullscreen');
  });
});

/**
 * MOBIL: fullscreen kontentni status bar (soat/batareya) va Telegram'ning
 * `X` / menyu tugmalari ostiga kirgizib yuborardi. Mobilda faqat `expand()`.
 */
describe('telegramWebApp — mobil Telegram (fullscreen BO\'LMASIN)', () => {
  beforeEach(() => {
    delete window.Telegram;
    delete window.TelegramWebviewProxy;
    document.querySelectorAll('script').forEach((s) => s.remove());
  });

  afterEach(() => {
    setHref('/');
    delete window.Telegram;
    delete window.TelegramWebviewProxy;
    document.querySelectorAll('script').forEach((s) => s.remove());
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
    initTelegramWebApp();
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toContain('expand');
    expect(calls).not.toContain('fullscreen');
  });
});
