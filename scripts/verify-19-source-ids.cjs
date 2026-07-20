/**
 * The 19 IDs are corrections in the SOURCE izohlar/variants database.
 * Find each source question by global_id, then find the matching LOCAL question
 * (media-first, then text), and verify izoh/answer consistency.
 */
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/Vosster PC/Desktop/projects/izohlar/variants";
const DST = path.join(__dirname, "..", "public", "data", "variants");

const IDS = [
  ["t_2_q_6", "Noto‘g‘ri chorraha tartibi"],
  ["t_2_q_16", "Yo‘l berish / tramvay"],
  ["t_4_q_18", "Shina ta’miri"],
  ["t_9_q_12", "To‘xtash ↔ 7.18"],
  ["t_12_q_16", "Bekat 15 m yo‘q"],
  ["t_15_q_17", "Tirkama ↔ tormoz"],
  ["t_17_q_7", "Reversiv yo‘l"],
  ["t_20_q_3", "1.9 ↔ 3.22"],
  ["t_21_q_9", "Burilish izohi"],
  ["t_23_q_10", "Tormoz ↔ aylanma"],
  ["t_28_q_5", "Yo‘nalish ↔ T-tramvay"],
  ["t_29_q_15", "105 ↔ 100 (svetofor)"],
  ["t_30_q_8", "Ko‘prik ↔ chorraha 30 m"],
  ["t_31_q_20", "Shina ta’miri"],
  ["t_36_q_10", "Trotuar ↔ velosiped"],
  ["t_44_q_9", "Tibbiy ↔ yo‘l"],
  ["t_51_q_15", "Yuk 0,5 m ↔ 4.7 tezlik"],
  ["t_53_q_14", "Tormoz 14,5 m"],
  ["t_62_q_10", "Juda qisqa izoh"],
];

const APOS = /[\u2018\u2019\u02BB\u02BC'\u00AB\u00BB\u201C\u201D]/g;
function softNorm(s) {
  return (s || "")
    .replace(APOS, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/chorraxa/g, "chorraha")
    .replace(/hisoplanadimi/g, "hisoblanadimi")
    .replace(/boshiangich/g, "boshlangich")
    .replace(/balanligi/g, "balandligi")
    .replace(/ornatilganyuk/g, "ornatilgan yuk")
    .replace(/yukhonasida/g, "yukxonasida")
    .replace(/yukhonasi/g, "yukxonasi")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function mediaKey(m) {
  return path.basename(String(m || "")).toLowerCase().replace(/\.(webp|png|jpg|jpeg)$/i, "");
}
function compactNorm(s) {
  return softNorm(s).replace(/\s+/g, "");
}
function correct(q, lang = "uz_lat") {
  return (q.content?.[lang]?.options || []).find((o) => o.is_correct) || null;
}
function optsSoft(q) {
  return (q.content?.uz_lat?.options || []).map((o) => softNorm(o.text)).filter(Boolean).sort();
}
function optsPerm(a, b) {
  const A = optsSoft(a);
  const B = optsSoft(b);
  return A.length && A.length === B.length && A.every((t, i) => t === B[i]);
}

function load(dir, max) {
  const byId = new Map();
  const byMedia = new Map();
  const bySoft = new Map();
  const byCompact = new Map();
  for (let i = 1; i <= max; i++) {
    const p = path.join(dir, `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
      const id = q.task_info?.global_id;
      const soft = softNorm(q.content?.uz_lat?.text);
      const compact = compactNorm(q.content?.uz_lat?.text);
      const mk = mediaKey(q.media_url);
      const e = { q, file: `v${i}`, id, soft, compact, mk };
      if (id) byId.set(id, e);
      if (mk) {
        if (!byMedia.has(mk)) byMedia.set(mk, []);
        byMedia.get(mk).push(e);
      }
      if (soft) {
        if (!bySoft.has(soft)) bySoft.set(soft, []);
        bySoft.get(soft).push(e);
      }
      if (compact) {
        if (!byCompact.has(compact)) byCompact.set(compact, []);
        byCompact.get(compact).push(e);
      }
    }
  }
  return { byId, byMedia, bySoft, byCompact };
}

function findLocal(srcE, dst) {
  const { soft, compact, mk, id } = srcE;
  if (mk && dst.byMedia.has(mk)) {
    const list = dst.byMedia.get(mk);
    if (list.length === 1) return { e: list[0], how: "media-unique" };
    const same = list.filter((x) => x.soft === soft || x.compact === compact);
    if (same.length === 1) return { e: same[0], how: "media+text" };
  }
  if (soft && dst.bySoft.has(soft)) {
    const list = dst.bySoft.get(soft);
    const permut = list.filter((x) => optsPerm(srcE.q, x.q));
    if (permut.length === 1) return { e: permut[0], how: "text+opts" };
    if (!mk) {
      const noM = list.filter((x) => !x.mk);
      if (noM.length === 1) return { e: noM[0], how: "text" };
      if (permut.length === 1) return { e: permut[0], how: "text+opts" };
    }
  }
  if (compact && dst.byCompact.has(compact)) {
    const list = dst.byCompact.get(compact);
    const permut = list.filter((x) => optsPerm(srcE.q, x.q));
    if (permut.length === 1) return { e: permut[0], how: "compact+opts" };
  }
  // same id only if same soft
  const byId = dst.byId.get(id);
  if (byId && (byId.soft === soft || byId.compact === compact)) {
    return { e: byId, how: "id" };
  }
  return { e: null, how: "none" };
}

function topicCheck(hint, izoh, text, ans) {
  const blob = softNorm([izoh, text, ans].join(" "));
  const rules = {
    "Noto‘g‘ri chorraha tartibi": [/chorrah|tartib|kesib/],
    "Yo‘l berish / tramvay": [/tramvay|yol ber|ustunlik|105|106/],
    "Shina ta’miri": [/shina|ta.?mir|5\.7|m1|m2|m3/],
    "To‘xtash ↔ 7.18": [/toxtash|7\.18|nogiron|3\.27/],
    "Bekat 15 m yo‘q": [/bekat|15\s*m|toxtash|avtobus/],
    "Tirkama ↔ tormoz": [/tirkama|tormoz|prichip|ulagich/],
    "Reversiv yo‘l": [/revers/],
    "1.9 ↔ 3.22": [/1\.9|3\.22|qarama|ikki tomonlama|chegara/],
    "Burilish izohi": [/buril|ag.?dar|suyuqlik|sisterna|muvozanat/],
    "Tormoz ↔ aylanma": [/tormoz|samarador/],
    "Yo‘nalish ↔ T-tramvay": [/tramvay|yonaltir|svetofor|qora/],
    "105 ↔ 100 (svetofor)": [/100|105|svetofor|taqiqlovchi|qizil|sariq/],
    "Ko‘prik ↔ chorraha 30 m": [/koprik|30\s*m|chorrah|toxtash/],
    "Trotuar ↔ velosiped": [/trotuar|velosiped|piyoda/],
    "Tibbiy ↔ yo‘l": [/qorin|jarohat|tibbiy|ovqat|ichish|yotqiz/],
    "Yuk 0,5 m ↔ 4.7 tezlik": [/0\s*[,\.]?\s*5|yuk|gabarit|162/],
    "Tormoz 14,5 m": [/14\s*[,\.]?\s*5|tormoz|masofa|tezlik/],
    "Juda qisqa izoh": [/l\s*toifa|moto/],
  };
  const rs = rules[hint] || [];
  if (!rs.length) return { ok: true, note: "no-rule" };
  const ok = rs.some((re) => re.test(blob));
  return { ok, note: ok ? "topic-ok" : "topic-weak" };
}

const src = load(SRC, 66);
const dst = load(DST, 63);

const rows = [];
for (const [id, hint] of IDS) {
  const srcE = src.byId.get(id);
  if (!srcE) {
    rows.push({ id, hint, status: "SOURCE_ID_MISSING" });
    continue;
  }
  const hit = findLocal(srcE, dst);
  const srcQ = srcE.q;
  const srcIz = (srcQ.izoh?.uz_lat || "").trim();
  const srcAns = correct(srcQ);

  if (!hit.e) {
    rows.push({
      id,
      hint,
      status: "NOT_FOUND_IN_LOCAL",
      srcFile: srcE.file,
      srcText: (srcQ.content?.uz_lat?.text || "").slice(0, 90),
      srcAns: (srcAns?.text || "").slice(0, 60),
      srcIzoh: srcIz.slice(0, 100),
      media: srcE.mk,
    });
    continue;
  }

  const locQ = hit.e.q;
  const locIz = (locQ.izoh?.uz_lat || "").trim();
  const locCyr = (locQ.izoh?.uz_cyr || "").trim();
  const locRu = (locQ.izoh?.ru || "").trim();
  const locAns = correct(locQ);
  const locAnsCyr = correct(locQ, "uz_cyr");
  const locAnsRu = correct(locQ, "ru");

  const issues = [];
  if (softNorm(srcIz) !== softNorm(locIz)) issues.push("izoh_lat_not_synced");
  if (softNorm(srcAns?.text) !== softNorm(locAns?.text)) issues.push("correct_answer_differs");
  if (!optsPerm(srcQ, locQ)) issues.push("options_not_same_set");
  if (!locCyr) issues.push("izoh_cyr_empty");
  if (!locRu) issues.push("izoh_ru_empty");
  if (locAns && locAnsCyr && locAns.id !== locAnsCyr.id) issues.push("correct_id_lat_cyr_mismatch");
  if (locAns && locAnsRu && locAns.id !== locAnsRu.id) issues.push("correct_id_lat_ru_mismatch");

  const topic = topicCheck(hint, locIz, locQ.content?.uz_lat?.text, locAns?.text);
  if (!topic.ok) issues.push("topic_mismatch_vs_error_type");

  // Readability: does izoh mention something contradictory to old error?
  // For Tormoz↔aylanma: izoh must NOT be about aylanma if question is tormoz
  if (hint.includes("Tormoz ↔ aylanma")) {
    if (/aylanma/.test(softNorm(locIz)) && !/tormoz/.test(softNorm(locIz))) {
      issues.push("still_wrong_aylanma_izoh");
    }
  }
  if (hint.includes("Yuk 0,5") || hint.includes("0,5 m")) {
    if (/4\.7|eng kam tezlik/.test(softNorm(locIz)) && !/0\s*[,\.]?\s*5|162|yuk/.test(softNorm(locIz))) {
      issues.push("still_wrong_speed_sign_izoh");
    }
  }
  if (hint.includes("Tibbiy")) {
    if (/yo.?l harakati qoidalarining 66|ikki tomonlama/.test(softNorm(locIz)) && !/qorin|jarohat|ovqat/.test(softNorm(locIz))) {
      issues.push("still_wrong_road_izoh_for_medical");
    }
  }

  rows.push({
    id,
    hint,
    status: issues.length ? "PROBLEM" : "OK",
    matchHow: hit.how,
    localId: hit.e.id,
    localFile: hit.e.file,
    srcFile: srcE.file,
    media: srcE.mk || hit.e.mk || "",
    question: (locQ.content?.uz_lat?.text || "").slice(0, 110),
    correct: (locAns?.text || "").slice(0, 80),
    izoh: locIz.slice(0, 140),
    izohLens: { lat: locIz.length, cyr: locCyr.length, ru: locRu.length },
    izohSynced: softNorm(srcIz) === softNorm(locIz),
    answerSynced: softNorm(srcAns?.text) === softNorm(locAns?.text),
    topic: topic.note,
    issues,
  });
}

const ok = rows.filter((r) => r.status === "OK").length;
const problems = rows.filter((r) => r.status === "PROBLEM");
const missing = rows.filter((r) => r.status === "NOT_FOUND_IN_LOCAL" || r.status === "SOURCE_ID_MISSING");

console.log(JSON.stringify({ summary: { total: IDS.length, ok, problems: problems.length, missing: missing.length }, problems, missing, all: rows }, null, 2));
