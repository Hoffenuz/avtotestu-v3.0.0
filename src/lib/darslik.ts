/**
 * Darslik katalogi ustidagi yordamchi funksiyalar.
 *
 * Katalogning O'ZI avtomatik yaratiladi (`src/data/darslikKatalog.ts`),
 * shuning uchun undan foydalanish mantiqi shu yerda — generator faylni
 * qayta yozganda bu kod yo'qolmaydi.
 */
import {
  DARSLIK_MODULES,
  type DarslikLangText,
  type DarslikLesson,
  type DarslikModule,
  type DarslikModuleKind,
} from "@/data/darslikKatalog";
import { contentKeyFromQuestionLang } from "@/lib/pickLangContent";

export type { DarslikLesson, DarslikModule, DarslikModuleKind };

/**
 * Uch tilli matndan joriy tilnikini tanlaydi.
 *
 * `questionLang` (`oz` | `uz` | `ru`) ishlatiladi — savollar va belgilar
 * bilan BIR XIL kalit, ya'ni darslik boshqa tilda qolib ketmaydi.
 */
export function localized(text: DarslikLangText, questionLang: string): string {
  const key = contentKeyFromQuestionLang(questionLang);
  return text[key] || text.uz_lat;
}

export function findModule(moduleId: string | undefined): DarslikModule | undefined {
  if (!moduleId) return undefined;
  return DARSLIK_MODULES.find((m) => m.id === moduleId);
}

export function moduleLessonIds(module: DarslikModule): string[] {
  return module.lessons.map((l) => l.id);
}

export const ALL_LESSON_IDS: readonly string[] = DARSLIK_MODULES.flatMap((m) =>
  m.lessons.map((l) => l.id),
);

/**
 * Davom ettiriladigan dars: birinchi KO'RILMAGAN dars.
 *
 * Hammasi ko'rilgan bo'lsa `null` — chaqiruvchi "tugallandi" holatini
 * ko'rsatadi, foydalanuvchini boshiga qaytarib yubormaydi.
 */
export function findNextLesson(
  progress: Record<string, { watched: boolean }>,
): { module: DarslikModule; lesson: DarslikLesson; index: number } | null {
  for (const module of DARSLIK_MODULES) {
    for (let i = 0; i < module.lessons.length; i += 1) {
      const lesson = module.lessons[i];
      if (!progress[lesson.id]?.watched) return { module, lesson, index: i };
    }
  }
  return null;
}

export { DARSLIK_MODULES };
export { DARSLIK_TOTAL_LESSONS } from "@/data/darslikKatalog";
