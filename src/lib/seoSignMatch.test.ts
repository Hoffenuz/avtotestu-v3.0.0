import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

/*
  Belgi sahifalariga savol bog'lash qoidasi (`scripts/lib/seo-slug.cjs`).

  Ilgari izohdagi HAR QANDAY raqam ("3.1-bandiga", "1.1 chizig'i") belgi
  kodi deb olinardi va "3.1 Kirish taqiqlangan" sahifasida tuman faralari
  haqidagi savol chiqardi. Endi kod faqat belgi NOMI bilan birga kelsa olinadi.
*/
const require = createRequire(import.meta.url);
const { extractNamedSignCodes } = require("../../scripts/lib/seo-slug.cjs") as {
  extractNamedSignCodes: (text: string, signMap: Map<string, { title: string }>) => string[];
};

const signs = new Map([
  ["3.1", { title: "Kirish taqiqlangan" }],
  ["3.27", { title: "To'xtash taqiqlangan" }],
  ["5.11.1", { title: "Qayrilish joyi" }],
  ["1.1", { title: "Shlagbaumli temir yo'l kesishmasi" }],
]);

describe("extractNamedSignCodes", () => {
  it("nomi bilan kelgan belgini topadi (turli qo'shtirnoq va apostrof)", () => {
    expect(extractNamedSignCodes("Yakka holda yoki 3.27 “To‘xtash taqiqlangan” yo‘l belgisi bilan", signs)).toEqual(["3.27"]);
    expect(extractNamedSignCodes('asosan: 3.27. "To\'xtash taqiqlangan". Transport', signs)).toEqual(["3.27"]);
  });

  it("YHQ bandi raqamini belgi deb olmaydi", () => {
    expect(extractNamedSignCodes("YHQ 3-ilovasi 3-bo'limining 3.1-bandiga asosan: tashqi yoritqichlar", signs)).toEqual([]);
  });

  it("yo'l chizig'i raqamini belgi deb olmaydi", () => {
    expect(extractNamedSignCodes("uzuq chiziq 1.1 yoki 1.11 chizig'iga yaqinlashayotganlik haqida", signs)).toEqual([]);
  });

  it("kod bor, lekin yonidagi nom boshqa belgiga tegishli bo'lsa — olmaydi", () => {
    expect(extractNamedSignCodes('3.1 "To\'xtash taqiqlangan"', signs)).toEqual([]);
  });

  it("nom biroz boshqacha yozilsa ham (so'z shakli) mos deb topadi", () => {
    expect(extractNamedSignCodes("5.11.1 «Qayrilib olish joyi» belgisi", signs)).toEqual(["5.11.1"]);
  });

  it("bir izohdagi bir nechta belgini ajratadi", () => {
    expect(
      extractNamedSignCodes('3.1 «Kirish taqiqlangan» va 3.27 «To\'xtash taqiqlangan» belgilari', signs).sort(),
    ).toEqual(["3.1", "3.27"]);
  });
});
