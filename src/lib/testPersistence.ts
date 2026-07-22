/**
 * Shared test persistence utilities.
 * All test interfaces use these helpers to ensure consistent
 * save/restore/cleanup behaviour across refresh, tab-close, and browser restart.
 */

/** Absolute ceiling for any test duration display/save: 60 min 59 sec */
export const MAX_TEST_TIME_SECONDS = 60 * 60 + 59; // 3659

/** Clamp elapsed/remaining seconds into [0, MAX_TEST_TIME_SECONDS] */
export function clampTestTimeSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return 0;
  return Math.min(MAX_TEST_TIME_SECONDS, Math.max(0, Math.round(seconds)));
}

/** Format mm:ss never exceeding 60:59 */
export function formatTestTime(seconds: number | null | undefined): string {
  const clamped = clampTestTimeSeconds(seconds ?? 0);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export interface PersistedTestState {
  questions?: unknown[];
  /** Raw multi-lang items (for random tests) so language switch/restore stays correct */
  rawSelected?: unknown[];
  /** questionLang at save time: oz | uz | ru */
  questionLang?: string;
  currentQuestion?: number;
  selectedAnswers?: Record<number, number>;
  correctAnswers?: Record<number, boolean>;
  revealedQuestions?: Record<number, boolean>;
  /** Absolute timestamp (ms) when the test timer expires */
  endsAt?: number;
  /** Absolute timestamp (ms) when the test was first started */
  startedAt?: number;
  /** Kept for backward-compat with old saves that stored raw seconds */
  timeRemaining?: number;
}

/** Read raw saved state without throwing */
export function getSavedTestState(storageKey: string): PersistedTestState | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw) as PersistedTestState;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Lazy useState initializer: returns remaining seconds from the saved endsAt
 * timestamp, or falls back to the component's defaultTime.
 * Call this inside `useState(() => getInitialTimeRemaining(...))`.
 */
export function getInitialTimeRemaining(storageKey: string, defaultTime: number): number {
  const saved = getSavedTestState(storageKey);
  const cappedDefault = clampTestTimeSeconds(defaultTime);
  if (saved?.endsAt) {
    return clampTestTimeSeconds(Math.floor((saved.endsAt - Date.now()) / 1000));
  }
  // Legacy saves stored raw seconds
  if (saved?.timeRemaining != null) {
    return clampTestTimeSeconds(saved.timeRemaining);
  }
  return cappedDefault;
}

/**
 * Lazy useState initializer: returns the original startedAt timestamp so that
 * timeTaken is computed correctly even after a page refresh.
 * Stale sessions (older than MAX_TEST_TIME_SECONDS) are capped so elapsed
 * time never balloons to hundreds of minutes.
 */
export function getInitialStartedAt(
  storageKey: string,
  options?: { /** null = never rewind long sessions (mavzuli elapsed timer) */ maxElapsedSec?: number | null },
): number {
  const saved = getSavedTestState(storageKey);
  const now = Date.now();
  const startedAt = saved?.startedAt;
  const maxElapsed =
    options && "maxElapsedSec" in options
      ? options.maxElapsedSec
      : MAX_TEST_TIME_SECONDS;

  if (typeof startedAt === "number" && startedAt > 0 && startedAt <= now) {
    if (maxElapsed == null) return startedAt;
    const elapsedSec = Math.floor((now - startedAt) / 1000);
    if (elapsedSec <= maxElapsed) return startedAt;
    // Abandoned tab / stale localStorage — pretend started just within max window
    return now - maxElapsed * 1000;
  }
  return now;
}

/** Wall-clock elapsed seconds since startedAt (no display clamp). */
export function getWallElapsedSeconds(startedAt: number): number {
  if (!Number.isFinite(startedAt) || startedAt <= 0) return 0;
  return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}

/** Elapsed seconds since startedAt, never above MAX_TEST_TIME_SECONDS */
export function getElapsedTestSeconds(startedAt: number, maxSeconds = MAX_TEST_TIME_SECONDS): number {
  return clampTestTimeSeconds(
    Math.min(getWallElapsedSeconds(startedAt), maxSeconds),
  );
}

/** Format duration for results / elapsed UI (supports hours; no 60:59 clamp). */
export function formatDurationSeconds(seconds: number): string {
  const s = Math.max(0, Math.round(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

/** Remove test state from localStorage. Silent – never throws. */
export function clearTestState(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // ignore quota / security errors
  }
}
