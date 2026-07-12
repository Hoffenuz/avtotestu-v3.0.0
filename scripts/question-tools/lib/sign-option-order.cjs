/**
 * Normalize sign-picker options so option id N matches label on image (1→"1", 2→"2", A→"A").
 */

const SINGLE_DIGIT = /^[1-9]$/;
const COMBO_DIGIT = /^([1-9])\s+(va|и)\s+([1-9])$/i;
const SINGLE_LETTER = /^[A-DVА-ДВ]$/;

/** Sign images use labels 1–5 (not numeric quiz answers like 6, 7). */
function isSignDigitLabel(text) {
  const t = String(text).trim();
  if (SINGLE_DIGIT.test(t)) return parseInt(t, 10) <= 5;
  const combo = t.match(COMBO_DIGIT);
  if (combo) return parseInt(combo[1], 10) <= 5 && parseInt(combo[3], 10) <= 5;
  return false;
}

function classifyOptions(options) {
  if (!options?.length) return null;
  const texts = options.map((o) => String(o.text).trim());
  const allSignDigit = texts.every((t) => isSignDigitLabel(t));
  const allLetter = texts.every((t) => SINGLE_LETTER.test(t));
  if (allSignDigit) return 'digit';
  if (allLetter) return 'letter';
  return null;
}

function rankDigit(text) {
  const t = text.trim();
  const combo = t.match(COMBO_DIGIT);
  if (combo) return 50 + parseInt(combo[1], 10);
  const n = parseInt(t, 10);
  if (SINGLE_DIGIT.test(t)) return n;
  return 999;
}

const LETTER_ORDER_LAT = ['A', 'B', 'C', 'D', 'V'];
const LETTER_ORDER_CYR = ['А', 'Б', 'В', 'Г', 'В'];

function rankLetter(text) {
  const t = text.trim();
  let idx = LETTER_ORDER_LAT.indexOf(t);
  if (idx >= 0) return idx + 1;
  idx = LETTER_ORDER_CYR.indexOf(t);
  if (idx >= 0) return idx + 1;
  return 999;
}

function sortOptions(options, kind) {
  const correctText = options.find((o) => o.is_correct)?.text?.trim() ?? '';
  const rank = kind === 'digit' ? rankDigit : rankLetter;
  const sorted = [...options].sort((a, b) => rank(a.text) - rank(b.text));
  return sorted.map((o, i) => ({
    id: i + 1,
    text: o.text,
    is_correct: String(o.text).trim() === correctText,
  }));
}

function usesCyrillicLetters(options) {
  return options.some((o) => LETTER_ORDER_CYR.includes(String(o.text).trim()));
}

function needsNormalizeOptions(options) {
  const kind = classifyOptions(options);
  if (!kind) return false;

  const rank = kind === 'digit' ? rankDigit : rankLetter;
  for (let i = 1; i < options.length; i++) {
    if (rank(options[i - 1].text) > rank(options[i].text)) return true;
  }

  // UI lists options by id 1..n — ids must be sequential; text stays image label (may skip numbers).
  for (let i = 0; i < options.length; i++) {
    if (options[i].id !== i + 1) return true;
  }
  return false;
}

function analyzeOptions(options) {
  const kind = classifyOptions(options);
  if (!kind) return null;
  const correctText = options.find((o) => o.is_correct)?.text?.trim() ?? '';
  const idTextMap = options.map((o) => `${o.id}=${o.text}`).join(', ');
  const normalized = sortOptions(options, kind);
  return {
    kind,
    correctText,
    idTextMap,
    normalized,
    needsFix: needsNormalizeOptions(options),
  };
}

function needsNormalize(analysis) {
  if (!analysis) return false;
  return analysis.needsFix;
}

function normalizeQuestionContent(content) {
  if (!content) return false;
  let changed = false;
  for (const loc of ['uz_lat', 'uz_cyr', 'ru']) {
    const block = content[loc];
    if (!block?.options?.length) continue;
    const analysis = analyzeOptions(block.options);
    if (!needsNormalize(analysis)) continue;
    block.options = analysis.normalized;
    changed = true;
  }
  return changed;
}

module.exports = {
  classifyOptions,
  analyzeOptions,
  needsNormalize,
  normalizeQuestionContent,
  sortOptions,
};
