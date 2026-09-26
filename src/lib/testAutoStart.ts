/**
 * /test-ishlash ga "darhol boshlash" so'rovi.
 *
 * Bosh sahifadagi "Sinab ko'ring" kartasidagi "Testni davom ettirish" shu
 * holat bilan o'tadi: boshlash sahifasi (savollar sonini tanlash) KO'RSATILMAY,
 * imtihon formatidagi 20 talik test darhol boshlanadi — odam allaqachon
 * savol yechib turibdi, uni yana bir tanlov ekrani oldida to'xtatmaymiz.
 *
 * Kelishuv shu faylda: yuboruvchi va qabul qiluvchi alohida yozsa, maydon
 * nomi bir kun ajralib ketib, tugma jimgina "oddiy" sahifani ochadigan
 * bo'lib qolardi.
 */
export const AUTO_START_COUNT = 20 as const;

export interface TestAutoStartState {
  autoStart: typeof AUTO_START_COUNT;
}

export const AUTO_START_STATE: TestAutoStartState = { autoStart: AUTO_START_COUNT };

/** `location.state` da darhol boshlash so'rovi bormi. */
export function wantsAutoStart(state: unknown): boolean {
  return (state as Partial<TestAutoStartState> | null | undefined)?.autoStart === AUTO_START_COUNT;
}
