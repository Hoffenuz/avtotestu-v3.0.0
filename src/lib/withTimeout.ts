/**
 * Race a promise against a timeout. Rejects with Error('timeout') on expiry.
 * Does not cancel the underlying work — callers should treat timeout as fail-closed.
 * Accepts PromiseLike so Supabase builders (thenables) work without casting.
 */
export function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/** Access RPC — keep short on mobile; AuthContext retries once */
export const AUTH_RPC_TIMEOUT_MS = 8_000;

/** start_test_session — premium must fail closed; free falls back offline */
export const TEST_SESSION_TIMEOUT_MS = 10_000;
