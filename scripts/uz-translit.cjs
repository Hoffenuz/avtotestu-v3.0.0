/**
 * O'zbek lotin -> kril transliteratsiya.
 * Izohlarni uz_cyr ga o'girish uchun ishlatiladi.
 */

const APOS = "[\\u2018\\u2019\\u02BB\\u02BC'`\\u00B4]";

// tartib muhim: uzun birikmalar oldin
function translitWord(w) {
  let out = "";
  let i = 0;
  const isVowel = (ch) => /[aeiouAEIOU\u0430\u0435\u0451\u0438\u043E\u0443\u045E\u044D\u0410\u0415\u0401\u0418\u041E\u0423\u040E\u042D]/.test(ch);
  const aposRe = new RegExp("^" + APOS);
  while (i < w.length) {
    const rest = w.slice(i);
    const prev = out.length ? out[out.length - 1] : "";
    const atStart = i === 0;

    // y + o'/u' birikmasidan oldin y -> й (yo'l -> йўл)
    let m = rest.match(new RegExp("^([Yy])(?=[OoUu]" + APOS + ")"));
    if (m) {
      out += m[1] === "Y" ? "Й" : "й";
      i += 1;
      continue;
    }
    // O'/o' -> Ў/ў, G'/g' -> Ғ/ғ
    m = rest.match(new RegExp("^([OoGg])" + APOS));
    if (m) {
      const ch = m[1];
      out += ch === "O" ? "Ў" : ch === "o" ? "ў" : ch === "G" ? "Ғ" : "ғ";
      i += m[0].length;
      continue;
    }
    // Sh/sh -> Ш/ш, Ch/ch -> Ч/ч
    m = rest.match(/^(SH|Sh|sh|CH|Ch|ch)/);
    if (m) {
      const s = m[0];
      const upper = s[0] === s[0].toUpperCase();
      out += s[0].toLowerCase() === "s" ? (upper ? "Ш" : "ш") : (upper ? "Ч" : "ч");
      i += 2;
      continue;
    }
    // Yo/yo -> Ё/ё, Yu/yu -> Ю/ю, Ya/ya -> Я/я, Ye/ye -> Е/е
    m = rest.match(/^(YO|Yo|yo|YU|Yu|yu|YA|Ya|ya|YE|Ye|ye)/);
    if (m) {
      const s = m[0];
      const upper = s[0] === s[0].toUpperCase();
      const map = { o: ["Ё", "ё"], u: ["Ю", "ю"], a: ["Я", "я"], e: ["Е", "е"] };
      const pair = map[s[1].toLowerCase()];
      out += upper ? pair[0] : pair[1];
      i += 2;
      continue;
    }
    // faqat ruscha o'zlashmalarda: tsiya -> ция, tsion -> цион
    m = rest.match(/^(tsiya|tsion|Tsiya|Tsion)/);
    if (m) {
      const s = m[0];
      const upper = s[0] === "T";
      out += (upper ? "Ц" : "ц") + (s.toLowerCase() === "tsiya" ? "ия" : "ион");
      i += 5;
      continue;
    }
    // tutuq belgisi -> ъ (unlidan keyin), aks holda tashlab yuboriladi
    m = rest.match(aposRe);
    if (m) {
      if (isVowel(prev)) out += "ъ";
      i += m[0].length;
      continue;
    }
    const ch = rest[0];
    const lower = ch.toLowerCase();
    const upper = ch !== lower;
    const single = {
      a: "а", b: "б", d: "д", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж",
      k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "қ", r: "р",
      s: "с", t: "т", u: "у", v: "в", x: "х", y: "й", z: "з", w: "в", c: "с",
    };
    if (lower === "e") {
      // so'z boshida yoki unlidan keyin -> э, aks holda -> е
      const useE = atStart || isVowel(prev) ? "э" : "е";
      out += upper ? useE.toUpperCase() : useE;
      i += 1;
      continue;
    }
    if (single[lower]) {
      out += upper ? single[lower].toUpperCase() : single[lower];
      i += 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

// istisno so'zlar (ruscha o'zlashmalar, ъ bilan yoziladi)
const EXCEPTIONS = [
  [/obyekt/g, "объект"], [/Obyekt/g, "Объект"], [/OBYEKT/g, "ОБЪЕКТ"],
  [/subyekt/g, "субъект"], [/Subyekt/g, "Субъект"],
];

function toCyrillic(text) {
  for (const [re, rep] of EXCEPTIONS) text = text.replace(re, rep);
  // YHQ akronimini saqlab qolish
  const P0 = "\uE000", P1 = "\uE001", P2 = "\uE002";
  text = text
    .replace(/\bYHQning\b/g, P2)
    .replace(/\bYHQga\b/g, P1)
    .replace(/\bYHQ\b/g, P0);
  // so'zma-so'z: harf bo'lmagan belgilarni saqlab qolamiz
  let out = text.replace(new RegExp("[A-Za-z]+(?:" + APOS + "[A-Za-z]+|" + APOS + ")*", "g"), (w) => translitWord(w));
  return out
    .replace(new RegExp(P2, "g"), "YHQнинг")
    .replace(new RegExp(P1, "g"), "YHQга")
    .replace(new RegExp(P0, "g"), "YHQ");
}

module.exports = { toCyrillic };
