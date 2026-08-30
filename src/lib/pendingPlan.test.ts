import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setPendingPlan, peekPendingPlan, clearPendingPlan } from './pendingPlan';

const KEY = 'pending_pro_plan';

describe('pendingPlan', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saqlangan tarifni qaytaradi', () => {
    setPendingPlan('weekly');
    expect(peekPendingPlan()).toBe('weekly');
  });

  it('peek o\'chirmaydi — takror o\'qish mumkin', () => {
    setPendingPlan('monthly');
    expect(peekPendingPlan()).toBe('monthly');
    expect(peekPendingPlan()).toBe('monthly');
  });

  it('hech narsa saqlanmagan bo\'lsa null', () => {
    expect(peekPendingPlan()).toBeNull();
  });

  it('clearPendingPlan tozalaydi', () => {
    setPendingPlan('yearly');
    clearPendingPlan();
    expect(peekPendingPlan()).toBeNull();
  });

  it('30 daqiqadan eski tanlov e\'tiborga olinmaydi', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    setPendingPlan('weekly');

    vi.setSystemTime(new Date('2026-01-01T10:29:00Z'));
    expect(peekPendingPlan()).toBe('weekly');

    vi.setSystemTime(new Date('2026-01-01T10:31:00Z'));
    expect(peekPendingPlan()).toBeNull();
  });

  it('eskirgan yozuv o\'qilgach o\'chiriladi', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    setPendingPlan('weekly');
    vi.setSystemTime(new Date('2026-01-01T11:00:00Z'));

    peekPendingPlan();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('buzuq JSON dasturni yiqitmaydi', () => {
    sessionStorage.setItem(KEY, 'not json{{');
    expect(peekPendingPlan()).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('tarif nomi bo\'sh bo\'lsa e\'tiborga olinmaydi', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ plan: '', at: Date.now() }));
    expect(peekPendingPlan()).toBeNull();
  });

  it('vaqt belgisi yo\'q eski formatdagi yozuv rad etiladi', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ plan: 'weekly' }));
    expect(peekPendingPlan()).toBeNull();
  });
});
