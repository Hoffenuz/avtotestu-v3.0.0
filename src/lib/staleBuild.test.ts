import { describe, it, expect, beforeEach, vi } from 'vitest';
import { currentEntry, entryFromHtml, fetchLatestEntry, isSafeToReload, shouldReloadFor } from './staleBuild';

describe('staleBuild', () => {
  beforeEach(() => localStorage.clear());

  it('HTML dan asosiy skript nomini oladi', () => {
    const html = '<script type="module" crossorigin src="/assets/index-DFw8Taee.js"></script><link href="/assets/vendor-react-CM8JfY08.js">';
    expect(entryFromHtml(html)).toBe('/assets/index-DFw8Taee.js');
    expect(entryFromHtml('<html></html>')).toBeNull();
  });

  it('joriy sahifadagi skriptni topadi, dev rejimda null', () => {
    document.head.innerHTML = '<script type="module" src="/assets/index-AAA111.js"></script>';
    expect(currentEntry()).toBe('/assets/index-AAA111.js');
    document.head.innerHTML = '<script type="module" src="/src/main.tsx"></script>';
    expect(currentEntry()).toBeNull();
  });

  it('test/imtihon sahifalarida reload qilmaydi', () => {
    for (const p of ['/', '/profile', '/belgilar/3-1', '/savol/abc', '/pro', '/test-ishlash/']) {
      expect(isSafeToReload(p)).toBe(true);
    }
    for (const p of ['/variant', '/mavzuli', '/real-imtihon', '/xatolar-testi', '/qiyin-savollar', '/e-avtomaktab-test', '/auth', '/auth/callback']) {
      expect(isSafeToReload(p)).toBe(false);
    }
  });

  it('bir xil build uchun 10 daqiqada faqat bir marta reload', () => {
    const t = 1_000_000;
    expect(shouldReloadFor('/assets/index-B.js', t)).toBe(true);
    expect(shouldReloadFor('/assets/index-B.js', t + 60_000)).toBe(false);
    expect(shouldReloadFor('/assets/index-C.js', t + 60_000)).toBe(true);
    expect(shouldReloadFor('/assets/index-C.js', t + 11 * 60_000)).toBe(true);
  });

  it('tarmoq xatosida hech narsa qilmaydi', async () => {
    const failing = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    expect(await fetchLatestEntry(failing as unknown as typeof fetch)).toBeNull();
    const notOk = vi.fn(async () => new Response('x', { status: 503 }));
    expect(await fetchLatestEntry(notOk as unknown as typeof fetch)).toBeNull();
  });
});
