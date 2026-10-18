import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null }) }));

import {
  __resetDarslikCacheForTests,
  markLessonWatched,
  saveLessonPosition,
} from "./darslikProgress";

const read = (owner: string) => JSON.parse(localStorage.getItem(`darslik:progress:v1:${owner}`) ?? "{}");

beforeEach(() => {
  localStorage.clear();
  __resetDarslikCacheForTests();
});

describe("darslik progress — hisob bo'yicha (ENG-06)", () => {
  it("A va B hisoblari bir qurilmada aralashmaydi", () => {
    markLessonWatched("user-a", "dars-1");
    saveLessonPosition("user-b", "dars-2", 40, 300);
    expect(read("user-a")).toEqual({ "dars-1": { watched: true, position: 0 } });
    expect(read("user-b")).toEqual({ "dars-2": { watched: false, position: 40 } });
  });

  it("eski umumiy progress birinchi kirgan hisobga o'tadi va qayta berilmaydi", () => {
    localStorage.setItem("darslik:progress:v1", JSON.stringify({ "dars-9": { watched: true, position: 0 } }));
    markLessonWatched("user-a", "dars-1");
    expect(read("user-a")).toEqual({
      "dars-9": { watched: true, position: 0 },
      "dars-1": { watched: true, position: 0 },
    });
    expect(localStorage.getItem("darslik:progress:v1")).toBeNull();
    markLessonWatched("user-b", "dars-2");
    expect(read("user-b")).toEqual({ "dars-2": { watched: true, position: 0 } });
  });

  it("mehmon eski progressni o'qiydi, lekin o'zlashtirmaydi", () => {
    localStorage.setItem("darslik:progress:v1", JSON.stringify({ "dars-9": { watched: true, position: 0 } }));
    markLessonWatched("guest", "dars-1");
    expect(read("guest")["dars-9"]).toBeTruthy();
    expect(localStorage.getItem("darslik:progress:v1")).not.toBeNull();
  });

  it("15 soniyadan qisqa pozitsiya saqlanmaydi, 90% — ko'rildi", () => {
    saveLessonPosition("u", "d", 10, 300);
    expect(read("u")).toEqual({});
    saveLessonPosition("u", "d", 280, 300);
    expect(read("u")).toEqual({ d: { watched: true, position: 0 } });
  });
});
