import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { IzohNavButton } from "./IzohBox";
import uzLat from "@/locales/uz-lat.json";

function renderButton(requirePro: boolean) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <IzohNavButton text="Haqiqiy izoh matni" requirePro={requirePro} />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe("IzohNavButton (UX-03)", () => {
  it("bepul testda qulf oldindan ko'rinadi va oynada namuna izoh bor", () => {
    renderButton(true);
    const btn = screen.getByRole("button", { name: uzLat.test.izohLockedLabel });
    expect(btn.textContent).toContain("PRO");
    fireEvent.click(btn);
    expect(screen.getByText(uzLat.test.izohSampleText)).toBeTruthy();
    // Haqiqiy (pulli) izoh bepul testda ko'rsatilmaydi
    expect(screen.queryByText("Haqiqiy izoh matni")).toBeNull();
  });

  it("PRO testda oddiy tugma va haqiqiy izoh", () => {
    renderButton(false);
    const btn = screen.getByRole("button", { name: uzLat.test.explanation });
    expect(btn.textContent).not.toContain("PRO");
    fireEvent.click(btn);
    expect(screen.getByText("Haqiqiy izoh matni")).toBeTruthy();
    expect(screen.queryByText(uzLat.test.izohSampleText)).toBeNull();
  });
});
