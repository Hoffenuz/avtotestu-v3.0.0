/**
 * Detect browser-level network failures ("Failed to fetch" and friends)
 * so they can be retried and shown to users with a friendly message.
 */
export function isNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const msg = ((err as Error).message ?? '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('fetch failed') ||
    msg.includes('timeout') ||
    msg.includes('aborted')
  );
}

export const NETWORK_ERROR_MESSAGE_UZ =
  "Internet aloqasida muammo yuz berdi. Internetingizni tekshirib, qayta urinib ko'ring.";
