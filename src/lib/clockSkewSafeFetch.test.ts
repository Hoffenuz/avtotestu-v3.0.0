import { describe, it, expect, vi } from 'vitest';
import { createClockSkewSafeFetch, withLocalExpiry } from './clockSkewSafeFetch';

const AUTH_URL = 'https://x.supabase.co/auth/v1/token?grant_type=refresh_token';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'content-length': '999' },
  });
}

describe('withLocalExpiry', () => {
  it('expires_at ni qurilma soati + expires_in qiladi', () => {
    const now = 2_000_000_000_000;
    const out = withLocalExpiry({ access_token: 't', expires_in: 3600, expires_at: 1 }, now);
    expect(out.expires_at).toBe(now / 1000 + 3600);
  });

  it('token bo\'lmagan javobga tegmaydi', () => {
    const body = { id: 'u1', email: 'a@b.c' } as Record<string, unknown>;
    expect(withLocalExpiry(body)).toBe(body);
  });
});

describe('createClockSkewSafeFetch', () => {
  it('soati 1 soat oldinda qurilmada yangi token "eskirgan" ko\'rinmaydi', async () => {
    const serverNowSec = 1_791_000_000;
    // Qurilma soati serverdan 1 soat oldinda
    const deviceNowMs = (serverNowSec + 3600) * 1000;
    vi.spyOn(Date, 'now').mockReturnValue(deviceNowMs);

    const base = vi.fn(async () =>
      jsonResponse({ access_token: 't', refresh_token: 'r', expires_in: 3600, expires_at: serverNowSec + 3600 }),
    );
    const res = await createClockSkewSafeFetch(base as unknown as typeof fetch)(AUTH_URL, { method: 'POST' });
    const body = await res.json();

    // supabase-js qoidasi: expires_at*1000 - Date.now() < 90 s → eskirgan
    expect(body.expires_at * 1000 - Date.now()).toBeGreaterThan(90_000);
    expect(body.refresh_token).toBe('r');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-length')).toBeNull();
    vi.restoreAllMocks();
  });

  it('auth bo\'lmagan so\'rovni o\'zgartirmaydi', async () => {
    const original = jsonResponse({ access_token: 't', expires_in: 3600, expires_at: 1 });
    const base = vi.fn(async () => original);
    const res = await createClockSkewSafeFetch(base as unknown as typeof fetch)('https://x.supabase.co/rest/v1/profiles');
    expect(res).toBe(original);
  });

  it('xato javobni o\'zgartirmaydi', async () => {
    const original = jsonResponse({ error: 'rate limit' }, 429);
    const base = vi.fn(async () => original);
    const res = await createClockSkewSafeFetch(base as unknown as typeof fetch)(AUTH_URL);
    expect(res).toBe(original);
  });
});

describe('supabase-js bilan (soat 1 soat oldinda)', () => {
  async function countRefreshes(wrap: boolean) {
    const { createClient } = await import('@supabase/supabase-js');
    const serverNowSec = Math.floor(Date.now() / 1000);
    const skewMs = 3600 * 1000;
    const realNow = Date.now.bind(Date);
    vi.spyOn(Date, 'now').mockImplementation(() => realNow() + skewMs);

    let refreshes = 0;
    const server = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.includes('grant_type=refresh_token')) {
        refreshes++;
        return jsonResponse({
          access_token: `a${refreshes}`, refresh_token: `r${refreshes}`, token_type: 'bearer',
          expires_in: 3600, expires_at: serverNowSec + 3600, user: { id: 'u1', aud: 'authenticated' },
        });
      }
      return jsonResponse({});
    });

    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
    const client = createClient('https://x.supabase.co', 'anon', {
      auth: { storage, autoRefreshToken: false, persistSession: true, detectSessionInUrl: false, storageKey: 'sk' },
      global: { fetch: (wrap ? createClockSkewSafeFetch(server as unknown as typeof fetch) : server) as typeof fetch },
    });
    // Server endigina bergan sessiya (server soati bo'yicha 1 soat amal qiladi)
    storage.setItem('sk', JSON.stringify({
      access_token: 'a0', refresh_token: 'r0', token_type: 'bearer', expires_in: 3600,
      expires_at: serverNowSec + 3600, user: { id: 'u1', aud: 'authenticated' },
    }));
    for (let i = 0; i < 5; i++) await client.auth.getSession();
    vi.restoreAllMocks();
    return refreshes;
  }

  it('tuzatishsiz: har so\'rovda refresh (bug takrorlanadi)', async () => {
    expect(await countRefreshes(false)).toBeGreaterThanOrEqual(5);
  });

  it('tuzatish bilan: faqat bitta refresh, keyin to\'xtaydi', async () => {
    expect(await countRefreshes(true)).toBe(1);
  });
});

describe('soat ORQADA: muddati o\'tgan token bilan qotib qolmaslik', () => {
  it('server "JWT expired" desa bitta majburiy refresh, keyin yangi token ishlatiladi', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const serverNowSec = Math.floor(Date.now() / 1000);
    const realNow = Date.now.bind(Date);
    // Qurilma soati 3 kun orqada
    vi.spyOn(Date, 'now').mockImplementation(() => realNow() - 3 * 86400 * 1000);

    let refreshes = 0;
    const tokensSeen: string[] = [];
    const server = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.includes('grant_type=refresh_token')) {
        refreshes++;
        return jsonResponse({
          access_token: 'fresh', refresh_token: 'r1', token_type: 'bearer',
          expires_in: 3600, expires_at: serverNowSec + 3600, user: { id: 'u1', aud: 'authenticated' },
        });
      }
      const auth = new Headers(init?.headers).get('Authorization') ?? '';
      tokensSeen.push(auth);
      if (auth === 'Bearer stale') {
        return new Response(JSON.stringify({ code: 'PGRST303', message: 'JWT expired' }), {
          status: 401, headers: { 'content-type': 'application/json' },
        });
      }
      return jsonResponse([{ id: 'u1' }]);
    });

    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
    // Eski kod saqlagan sessiya: expires_at SERVER soati bo'yicha, 1 soat oldin tugagan
    storage.setItem('sk2', JSON.stringify({
      access_token: 'stale', refresh_token: 'r0', token_type: 'bearer', expires_in: 3600,
      expires_at: serverNowSec - 3600, user: { id: 'u1', aud: 'authenticated' },
    }));

    let lastForced = -Infinity;
    // eslint-disable-next-line prefer-const
    let client: ReturnType<typeof createClient>;
    const onJwtExpired = () => {
      if (realNow() - lastForced < 30_000) return;
      lastForced = realNow();
      setTimeout(() => { void client.auth.refreshSession(); }, 0);
    };
    client = createClient('https://x.supabase.co', 'anon', {
      auth: { storage, autoRefreshToken: false, persistSession: true, detectSessionInUrl: false, storageKey: 'sk2' },
      global: { fetch: createClockSkewSafeFetch(server as unknown as typeof fetch, { onJwtExpired }) as typeof fetch },
    });

    // Qurilma soati bo'yicha token hali "yaroqli" — tuzatishsiz u abadiy yuborilardi
    const first = await client.from('profiles').select('id');
    expect(first.status).toBe(401);
    await client.from('profiles').select('id'); // bir vaqtda ketgan ikkinchisi — qo'shimcha refresh bermasin
    await new Promise((r) => setTimeout(r, 50));
    const after = await client.from('profiles').select('id');

    expect(refreshes).toBe(1);
    expect(after.status).toBe(200);
    expect(tokensSeen[tokensSeen.length - 1]).toBe('Bearer fresh');
    vi.restoreAllMocks();
  });

  it('auth so\'rovi yoki boshqa 401 refresh chaqirmaydi', async () => {
    const onJwtExpired = vi.fn();
    const base = vi.fn(async () => new Response(JSON.stringify({ code: '42501', message: 'permission denied' }), {
      status: 401, headers: { 'content-type': 'application/json' },
    }));
    await createClockSkewSafeFetch(base as unknown as typeof fetch, { onJwtExpired })('https://x.supabase.co/rest/v1/rpc/f');
    expect(onJwtExpired).not.toHaveBeenCalled();
  });
});
