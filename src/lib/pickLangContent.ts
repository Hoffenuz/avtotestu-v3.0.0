/** content.uz_lat / uz_cyr / ru block */
export type LangContentBlock = {
  text?: string;
  options?: { id: number; text: string; is_correct?: boolean }[];
};

export type MultiLangContent = {
  uz_lat?: LangContentBlock;
  uz_cyr?: LangContentBlock;
  ru?: LangContentBlock;
};

export type ContentLangKey = "uz_lat" | "uz_cyr" | "ru";

/** UI questionLang (oz|uz|ru) → JSON content key */
export function contentKeyFromQuestionLang(questionLang: string): ContentLangKey {
  if (questionLang === "oz" || questionLang === "uz-lat") return "uz_lat";
  if (questionLang === "uz" || questionLang === "uz_cyr") return "uz_cyr";
  return "ru";
}

function usable(block: LangContentBlock | undefined): block is LangContentBlock {
  return !!block?.options?.length;
}

/**
 * Pick language block WITHOUT silently substituting Latin for Russian/Cyrillic.
 * Incomplete CDN caches (e.g. early v63 with only uz_lat) previously fell back
 * to Latin and looked like a "language bug".
 */
export function pickLangContent(
  content: MultiLangContent | undefined,
  questionLang: string,
): LangContentBlock | undefined {
  if (!content) return undefined;
  const key = contentKeyFromQuestionLang(questionLang);

  if (usable(content[key])) return content[key];

  // Latin UI only: allow fallback to other langs if latin block missing
  if (key === "uz_lat") {
    if (usable(content.uz_cyr)) return content.uz_cyr;
    if (usable(content.ru)) return content.ru;
  }

  return undefined;
}

export function pickIzohText(
  izoh: { uz_lat?: string; uz_cyr?: string; ru?: string } | string | undefined,
  questionLang: string,
): string | undefined {
  if (!izoh) return undefined;
  if (typeof izoh === "string") {
    const t = izoh.trim();
    return t || undefined;
  }
  const key = contentKeyFromQuestionLang(questionLang);
  const primary = (izoh[key] || "").trim();
  if (primary) return primary;
  if (key === "uz_lat") {
    return (izoh.uz_cyr || izoh.ru || "").trim() || undefined;
  }
  return undefined;
}
