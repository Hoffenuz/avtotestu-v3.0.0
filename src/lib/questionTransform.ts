/** Map raw JSON question items to in-app question shape (uz_lat / uz_cyr / ru). */

export interface AppQuestion {
  id: number;
  text: string;
  image?: string;
  correctAnswer: number;
  answers: { id: number; text: string }[];
  /** Tanlangan tildagi izoh matni */
  izoh?: string;
}

type IzohLangMap = { uz_lat?: string; uz_cyr?: string; ru?: string };

function pickIzoh(izoh: IzohLangMap | string | undefined, langKey: 'uz_lat' | 'uz_cyr' | 'ru'): string | undefined {
  if (!izoh) return undefined;
  if (typeof izoh === 'string') {
    const t = izoh.trim();
    return t || undefined;
  }
  const t = (izoh[langKey] || izoh.uz_lat || izoh.uz_cyr || izoh.ru || '').trim();
  return t || undefined;
}

export function transformRawToQuestions(
  selectedQuestions: unknown[],
  questionLang: string,
  imagePrefix: string
): AppQuestion[] {
  return selectedQuestions.map((item, idx) => {
    const q = item as {
      content?: {
        uz_lat?: { text: string; options: { id: number; text: string; is_correct: boolean }[] };
        uz_cyr?: { text: string; options: { id: number; text: string; is_correct: boolean }[] };
        ru?: { text: string; options: { id: number; text: string; is_correct: boolean }[] };
      };
      media_url?: string;
      izoh?: IzohLangMap | string;
      choises?: Array<{ text: string; answer: boolean }>;
      question?: string | { oz?: string; uz?: string; ru?: string };
      image?: string;
      media?: { exist: boolean; name: string };
      photo?: string | null;
      answers?: {
        status: number;
        answer?: { oz?: string[]; uz?: string[]; ru?: string[] };
      };
    };

    if (q.content && (q.content.uz_lat || q.content.uz_cyr || q.content.ru)) {
      const langKey =
        questionLang === 'oz' ? 'uz_lat' : questionLang === 'uz' ? 'uz_cyr' : 'ru';
      const langContent =
        q.content[langKey] || q.content.uz_lat || q.content.uz_cyr || q.content.ru;
      if (!langContent?.options?.length) {
        return { id: idx + 1, text: '', answers: [], correctAnswer: 1 };
      }
      const correctOption = langContent.options.find((o) => o.is_correct);
      const correctAnswer = correctOption ? correctOption.id : langContent.options[0].id;
      let imagePath: string | undefined;
      if (q.media_url?.trim()) {
        imagePath = q.media_url.startsWith('http')
          ? q.media_url
          : `${imagePrefix}${q.media_url}`;
      }
      return {
        id: idx + 1,
        text: langContent.text,
        image: imagePath,
        correctAnswer,
        answers: langContent.options.map((o) => ({ id: o.id, text: o.text })),
        izoh: pickIzoh(q.izoh, langKey),
      };
    }

    if (q.choises && Array.isArray(q.choises)) {
      const correctIndex = q.choises.findIndex((c) => c.answer === true);
      let imagePath: string | undefined;
      if (q.media?.exist && q.media?.name) {
        imagePath = `${imagePrefix}${q.media.name}.png`;
      } else if (q.image) {
        imagePath = `${imagePrefix}${q.image}`;
      }
      return {
        id: idx + 1,
        text: typeof q.question === 'string' ? q.question : '',
        image: imagePath,
        correctAnswer: correctIndex >= 0 ? correctIndex + 1 : 1,
        answers: q.choises.map((choice, ansIdx) => ({
          id: ansIdx + 1,
          text: choice.text,
        })),
      };
    }

    const answerLang = questionLang as 'oz' | 'uz' | 'ru';
    const questionObj = q.question;
    const answers =
      q.answers?.answer?.[answerLang] ||
      q.answers?.answer?.uz ||
      q.answers?.answer?.oz ||
      [];
    const questionText =
      typeof questionObj === 'string'
        ? questionObj
        : (questionObj as { oz?: string; uz?: string; ru?: string })?.[answerLang] ||
          (questionObj as { oz?: string; uz?: string; ru?: string })?.uz ||
          (questionObj as { oz?: string; uz?: string; ru?: string })?.oz ||
          '';
    const photoField = q.photo ?? q.image;

    return {
      id: idx + 1,
      text: questionText,
      image: photoField ? `${imagePrefix}${photoField}` : undefined,
      correctAnswer: q.answers?.status || 1,
      answers: answers.map((answerText, ansIdx) => ({
        id: ansIdx + 1,
        text: answerText,
      })),
    };
  });
}
