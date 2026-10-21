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

describe("IzohNavButton", () => {
  it("bepul testda tugma oddiy, oynada faqat PRO taklifi", () => {
    renderButton(true);
    const btn = screen.getByRole("button", { name: uzLat.test.explanation });
    expect(btn.textContent).not.toContain("PRO");
    fireEvent.click(btn);
    expect(screen.getByText(uzLat.test.izohProCta)).toBeTruthy();
    // Haqiqiy (pulli) izoh bepul testda ko'rsatilmaydi
    expect(screen.queryByText("Haqiqiy izoh matni")).toBeNull();
  });

  it("PRO testda haqiqiy izoh", () => {
    renderButton(false);
    fireEvent.click(screen.getByRole("button", { name: uzLat.test.explanation }));
    expect(screen.getByText("Haqiqiy izoh matni")).toBeTruthy();
    expect(screen.queryByText(uzLat.test.izohProCta)).toBeNull();
  });
});
