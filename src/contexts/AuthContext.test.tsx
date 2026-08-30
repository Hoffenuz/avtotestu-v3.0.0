/**
 * AuthContext regressiya testlari.
 *
 * Har bir test — haqiqatan production da yuz bergan bug uchun. Ular
 * "akkauntni to'g'ri tekshira olmaslik" va cheksiz spinner shikoyatlarining
 * sababi edi. Bu testlar o'sha xatolar qaytib kelishining oldini oladi.
 */
import { render, screen, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Supabase mock ────────────────────────────────────────────────────────────
// Haqiqiy client import paytida VITE_* env talab qiladi va tarmoqqa chiqadi,
// shuning uchun butun modulni almashtiramiz.

const h = vi.hoisted(() => {
  type AuthCb = (event: string, session: unknown) => void;
  const authCallbacks: AuthCb[] = [];
  return {
    authCallbacks,
    getSession: vi.fn(),
    rpc: vi.fn(),
    from: vi.fn(),
    unsubscribe: vi.fn(),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: h.getSession,
      onAuthStateChange: (cb: (e: string, s: unknown) => void) => {
        h.authCallbacks.push(cb);
        return { data: { subscription: { unsubscribe: h.unsubscribe } } };
      },
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    rpc: h.rpc,
    from: h.from,
  },
}));

import { AuthProvider, useAuth } from "./AuthContext";

// ── Yordamchilar ─────────────────────────────────────────────────────────────

const USER_ID = "11111111-2222-3333-4444-555555555555";

const session = (id = USER_ID) => ({
  access_token: "t",
  user: { id, email: "u@example.com" },
});

/** supabase.from('profiles').select().eq().single() zanjiri */
function profileChain(result: unknown, neverResolves = false) {
  const single = () =>
    neverResolves ? new Promise(() => {}) : Promise.resolve(result);
  return { select: () => ({ eq: () => ({ single }) }) };
}

const proRow = [
  { state: "active_pro", is_premium: true, expires_at: "2099-01-01T00:00:00Z" },
];

function Probe() {
  const { user, isLoading, accessState, isPremium, backendConfirmed, accessStateLoading } =
    useAuth();
  return (
    <div>
      <span data-testid="user">{user?.id ?? "none"}</span>
      <span data-testid="isLoading">{String(isLoading)}</span>
      <span data-testid="state">{accessState}</span>
      <span data-testid="premium">{String(isPremium)}</span>
      <span data-testid="confirmed">{String(backendConfirmed)}</span>
      <span data-testid="accessLoading">{String(accessStateLoading)}</span>
    </div>
  );
}

const renderAuth = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

/** onAuthStateChange ga obuna bo'lgan barcha callbacklarni chaqiradi */
async function emit(event: string, s: unknown) {
  await act(async () => {
    h.authCallbacks.forEach((cb) => cb(event, s));
    // deferFromAuthCallback setTimeout(fn, 0) ishlatadi
    await new Promise((r) => setTimeout(r, 0));
  });
}

beforeEach(() => {
  h.authCallbacks.length = 0;
  h.getSession.mockReset();
  h.rpc.mockReset();
  h.from.mockReset();
  h.from.mockReturnValue(profileChain({ data: null, error: null }));
  localStorage.clear();
});

// ── Testlar ──────────────────────────────────────────────────────────────────

describe("AuthContext — sessiyani aniqlash", () => {
  it("odatiy holat: getSession sessiya qaytarsa foydalanuvchi va PRO holati yuklanadi", async () => {
    h.getSession.mockResolvedValue({ data: { session: session() } });
    h.rpc.mockResolvedValue({ data: proRow, error: null });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(USER_ID));
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("active_pro"));
    expect(screen.getByTestId("premium")).toHaveTextContent("true");
    expect(screen.getByTestId("confirmed")).toHaveTextContent("true");
  });

  /**
   * ASOSIY REGRESSIYA.
   * getSession() mobil tarmoqda / supabase auth lock band bo'lganda osilib
   * qoladi va 3.5s da timeout bo'ladi. O'sha holatda sessiyani qo'llaydigan
   * yagona yo'l — INITIAL_SESSION hodisasi. Ilgari u `return` bilan butunlay
   * tashlab yuborilardi va natijada TIZIMGA KIRGAN, hatto PRO to'lagan
   * foydalanuvchi ilova nazarida "mehmon" bo'lib qolardi.
   */
  it("getSession osilib qolsa ham INITIAL_SESSION sessiyani tiklaydi (mehmon bo'lib qolmaydi)", async () => {
    h.getSession.mockReturnValue(new Promise(() => {})); // hech qachon tugamaydi
    h.rpc.mockResolvedValue({ data: proRow, error: null });

    renderAuth();

    // Boshida foydalanuvchi yo'q — getSession javob bermayapti
    expect(screen.getByTestId("user")).toHaveTextContent("none");

    await emit("INITIAL_SESSION", session());

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(USER_ID));
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("active_pro"));
    expect(screen.getByTestId("premium")).toHaveTextContent("true");
    // UI bloklanmasligi kerak
    expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
  });

  it("INITIAL_SESSION sessiyasiz kelsa foydalanuvchi paydo bo'lmaydi", async () => {
    h.getSession.mockResolvedValue({ data: { session: null } });

    renderAuth();
    await emit("INITIAL_SESSION", null);

    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(screen.getByTestId("state")).toHaveTextContent("guest");
  });

  it("INITIAL_SESSION getSession dan keyin kelsa PRO holati ikki marta yuklanmaydi", async () => {
    h.getSession.mockResolvedValue({ data: { session: session() } });
    h.rpc.mockResolvedValue({ data: proRow, error: null });

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(USER_ID));

    const callsBefore = h.rpc.mock.calls.length;
    await emit("INITIAL_SESSION", session());

    expect(h.rpc.mock.calls.length).toBe(callsBefore);
  });
});

describe("AuthContext — spinner hech qachon osilib qolmasligi", () => {
  /**
   * ASOSIY REGRESSIYA (cheksiz spinner).
   *
   * fetchAccessState finally blokida spinner o'chirish `isStale()` ga
   * bog'langan edi, u esa `userIdRef.current !== userId` ni ham "stale" deb
   * hisoblardi. Agar RPC javob kutayotgan paytda sessiya boshqa foydalanuvchiga
   * almashsa (masalan USER_UPDATED) va clearAccessState chaqirilmasa, eng
   * oxirgi chaqiruv ham stale sanalib, setAccessStateLoading(false) UMUMAN
   * bajarilmasdi. Uni tozalaydigan boshqa hech kim yo'q edi →
   * accessStateLoading abadiy true → /variant, /mavzuli, /darslik cheksiz
   * "Yuklanmoqda" spinner da qotib qolardi.
   *
   * Shuning uchun "eskirgan ma'lumotni qo'llamaslik" va "spinnerni o'chirish"
   * shartlari ajratildi (isStale vs supersededByNewer).
   */
  it("RPC javobi paytida sessiya almashsa ham spinner o'chadi", async () => {
    let resolveRpc: (v: unknown) => void = () => {};
    const pending = new Promise((res) => {
      resolveRpc = res;
    });

    h.getSession.mockResolvedValue({ data: { session: session() } });
    h.rpc.mockReturnValue(pending);

    renderAuth();

    // RPC javob kutmoqda — spinner yoqilgan
    await waitFor(() =>
      expect(screen.getByTestId("accessLoading")).toHaveTextContent("true"),
    );

    // Sessiya BOSHQA foydalanuvchiga almashadi. USER_UPDATED da na SIGNED_IN
    // shoxobchasi, na clearAccessState ishlaydi — ya'ni spinnerni tozalaydigan
    // hech kim qolmaydi; uni faqat uchayotgan chaqiruvning o'zi o'chirishi kerak.
    await emit("USER_UPDATED", session("99999999-8888-7777-6666-555555555555"));

    await act(async () => {
      resolveRpc({ data: proRow, error: null });
      await new Promise((r) => setTimeout(r, 0));
    });

    await waitFor(() =>
      expect(screen.getByTestId("accessLoading")).toHaveTextContent("false"),
    );
  }, 10000);

  it("RPC xato qaytarsa ham accessStateLoading false ga qaytadi", async () => {
    h.getSession.mockResolvedValue({ data: { session: session() } });
    h.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    renderAuth();

    await waitFor(
      () => expect(screen.getByTestId("accessLoading")).toHaveTextContent("false"),
      { timeout: 5000 },
    );
    // Backend tasdiqlanmagan — lekin UI bloklanmaydi
    expect(screen.getByTestId("confirmed")).toHaveTextContent("false");
  }, 10000);

  it("profil so'rovi osilib qolsa ham PRO holati va spinner hal bo'ladi", async () => {
    h.getSession.mockResolvedValue({ data: { session: session() } });
    h.from.mockReturnValue(profileChain(null, true)); // profiles hech qachon javob bermaydi
    h.rpc.mockResolvedValue({ data: proRow, error: null });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("active_pro"));
    await waitFor(() =>
      expect(screen.getByTestId("accessLoading")).toHaveTextContent("false"),
    );
  }, 10000);
});
