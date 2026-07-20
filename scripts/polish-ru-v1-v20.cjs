/**
 * Manual polish for v1–v20 RU options/izoh that auto-translate mangled.
 *   node scripts/polish-ru-v1-v20.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DST = path.join(ROOT, "public", "data", "variants");

/** @type {Record<string, { opts?: {id:number,text:string,is_correct:boolean}[], izoh_ru?: string, q_ru?: string }>} */
const FIXES = {
  t_2_q_19: {
    izoh_ru:
      "Приложение 1 ПДД, знак 3.2 «Движение запрещено». Действие знака не распространяется на транспортные средства, водители которых проживают или работают в обозначенной зоне (знак «C»).",
  },
  t_3_q_2: {
    opts: [
      { id: 1, text: "На железнодорожных переездах и на расстоянии менее 100 м от них", is_correct: true },
      { id: 2, text: "На железнодорожных переездах и на расстоянии более 100 м от них", is_correct: false },
      {
        id: 3,
        text: "На железнодорожных переездах и вне населённых пунктов на расстоянии более 100 м от них",
        is_correct: false,
      },
    ],
  },
  t_3_q_5: {
    opts: [
      { id: 1, text: "Трамвай и зелёный автомобиль, жёлтый автомобиль", is_correct: true },
      { id: 2, text: "Зелёный, жёлтый автомобили, трамвай", is_correct: false },
      { id: 3, text: "Трамвай, жёлтый, зелёный автомобили", is_correct: false },
    ],
  },
  t_3_q_8: {
    opts: [
      { id: 1, text: "Одежда надевается одновременно на обе руки", is_correct: false },
      {
        id: 2,
        text: "Одежду сначала надевают на повреждённую руку, затем на здоровую",
        is_correct: true,
      },
      {
        id: 3,
        text: "Одежду сначала надевают на здоровую руку, затем на повреждённую",
        is_correct: false,
      },
    ],
    izoh_ru:
      "Чтобы надеть одежду, не заставляя повреждённую руку или ногу двигаться, её осторожно надевают сначала на повреждённую, а затем на неповреждённую руку или ногу.",
  },
  t_4_q_2: {
    opts: [
      { id: 1, text: "Должны уступить дорогу обоим", is_correct: true },
      { id: 2, text: "Должны уступить дорогу мотоциклу", is_correct: false },
      { id: 3, text: "Имеете преимущественное право проезда", is_correct: false },
    ],
  },
  t_4_q_6: {
    opts: [
      { id: 1, text: "Синий одновременно с красным; зелёный; жёлтый", is_correct: false },
      {
        id: 2,
        text: "Жёлтый автомобиль въезжает на перекрёсток и останавливается, чтобы пропустить синий; зелёный; синий одновременно с красным; жёлтый",
        is_correct: true,
      },
      { id: 3, text: "Зелёный; синий одновременно с красным; жёлтый", is_correct: false },
    ],
  },
  t_5_q_13: {
    opts: [
      { id: 1, text: "Снимать одежду с обеих рук одновременно", is_correct: false },
      {
        id: 2,
        text: "Снимать одежду начиная со здоровой руки, затем освободить повреждённую",
        is_correct: true,
      },
      {
        id: 3,
        text: "Снимать одежду начиная с повреждённой руки, затем освободить здоровую",
        is_correct: false,
      },
    ],
  },
  t_6_q_8: {
    opts: [
      { id: 1, text: "Должен на любом пешеходном переходе", is_correct: false },
      {
        id: 2,
        text: "Должен во всех случаях, в том числе вне пешеходных переходов",
        is_correct: true,
      },
      { id: 3, text: "Должен на регулируемом пешеходном переходе", is_correct: false },
      { id: 4, text: "Должен на нерегулируемом пешеходном переходе", is_correct: false },
    ],
  },
  t_7_q_16: {
    opts: [
      { id: 1, text: "Автобус, легковой автомобиль, трамвай", is_correct: false },
      { id: 2, text: "Легковой автомобиль, трамвай, автобус", is_correct: false },
      { id: 3, text: "Трамвай, автобус, легковой автомобиль", is_correct: true },
    ],
  },
  t_8_q_2: {
    q_ru: "По какой траектории движется прицеп легкового автомобиля при повороте?",
    opts: [
      {
        id: 1,
        text: "Вне траектории автомобиля относительно центра поворота",
        is_correct: false,
      },
      {
        id: 2,
        text: "Внутри траектории автомобиля относительно центра поворота",
        is_correct: true,
      },
      { id: 3, text: "По траектории поворота автомобиля", is_correct: false },
    ],
    izoh_ru:
      "Согласно основам безопасности дорожного движения, прицеп легкового автомобиля при повороте движется внутри траектории автомобиля относительно центра поворота.",
  },
  t_8_q_10: {
    opts: [
      { id: 1, text: "Три полосы для движения", is_correct: false },
      { id: 2, text: "Две полосы для движения", is_correct: true },
      { id: 3, text: "Одну полосу для движения", is_correct: false },
    ],
    izoh_ru:
      "Общие положения ПДД: полоса движения — любой продольный участок проезжей части, обозначенный или не обозначенный разметкой, достаточный по ширине для движения автомобилей в один ряд.",
  },
  t_9_q_18: {
    opts: [
      { id: 1, text: "Легковой автомобиль", is_correct: false },
      { id: 2, text: "Оба поставлены неправильно", is_correct: true },
      { id: 3, text: "Грузовой автомобиль", is_correct: false },
      { id: 4, text: "Оба поставлены правильно", is_correct: false },
    ],
  },
  t_12_q_1: {
    opts: [
      { id: 1, text: "В кабине буксирующего автомобиля", is_correct: true },
      { id: 2, text: "В кузове буксирующего автомобиля", is_correct: false },
      { id: 3, text: "В кабине обоих автомобилей", is_correct: false },
      { id: 4, text: "В кабине буксируемого автомобиля", is_correct: false },
    ],
    izoh_ru:
      "Согласно пункту 143 главы 24 ПДД: при буксировке на жёсткой или гибкой сцепке запрещается перевозить людей в автобусе, троллейбусе и в кузове грузового автомобиля; при буксировке методом частичной погрузки — в кабине и кузове буксируемого ТС, а также в кузове буксирующего. Соответственно, при частичной погрузке пассажиры могут находиться в кабине буксирующего автомобиля.",
  },
  t_12_q_10: {
    opts: [
      {
        id: 1,
        text: "Транспортные средства, движущиеся по кругу, имеют преимущество перед въезжающими",
        is_correct: true,
      },
      {
        id: 2,
        text: "Въезжающие на круг транспортные средства имеют преимущество перед движущимися по кругу",
        is_correct: false,
      },
    ],
  },
  t_12_q_15: {
    opts: [
      { id: 1, text: "Легковой автомобиль, автобус, трамвай", is_correct: false },
      { id: 2, text: "Трамвай, автобус, легковой автомобиль", is_correct: false },
      { id: 3, text: "Трамвай, легковой автомобиль, автобус", is_correct: true },
    ],
  },
  t_14_q_7: {
    opts: [
      {
        id: 1,
        text: "На одну ось установлены диагональные шины вместе с радиальными",
        is_correct: false,
      },
      {
        id: 2,
        text: "На передней оси ТС категории М1 установлены шины, восстановленные по первому классу ремонта",
        is_correct: true,
      },
      {
        id: 3,
        text: "Шины не соответствуют модели ТС по размеру и допустимому давлению",
        is_correct: false,
      },
    ],
  },
  t_14_q_17: {
    izoh_ru:
      "Согласно пункту 56 главы 9 ПДД (подпункт 1): во всех случаях, кроме въезда на перекрёстки с круговым движением, перед поворотом направо, налево или разворотом водитель обязан заранее занять крайнее положение на проезжей части, предназначенное для движения в данном направлении.",
  },
  t_18_q_1: {
    opts: [
      { id: 1, text: "Зелёный; красный одновременно с синим", is_correct: true },
      { id: 2, text: "Синий одновременно с зелёным; красный", is_correct: false },
      { id: 3, text: "Синий, зелёный, красный", is_correct: false },
    ],
  },
  t_18_q_15: {
    opts: [
      {
        id: 1,
        text: "Красному автомобилю — прямо, синему — прямо и налево",
        is_correct: false,
      },
      { id: 2, text: "Красному и синему автомобилю — прямо", is_correct: false },
      { id: 3, text: "Красному автомобилю — прямо, синему — налево", is_correct: true },
    ],
  },
  t_20_q_9: {
    opts: [
      { id: 1, text: "Велосипед, белый автомобиль, красный автомобиль", is_correct: true },
      { id: 2, text: "Красный автомобиль, белый автомобиль, велосипед", is_correct: false },
      { id: 3, text: "Велосипед, красный автомобиль, белый автомобиль", is_correct: false },
    ],
    izoh_ru:
      "Согласно пункту 104 (подпункт 1) и пункту 107 главы 16 ПДД: на перекрёстке неравнозначных дорог водитель ТС, движущегося по второстепенной дороге, обязан уступить дорогу ТС, приближающимся по главной, независимо от направления их дальнейшего движения. При повороте налево или развороте водитель безрельсового ТС обязан уступить дорогу ТС, движущимся по равнозначной дороге со встречного направления прямо или направо.",
  },
};

function soft(s) {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function hasDup(opts) {
  const texts = opts.map((o) => soft(o.text));
  return texts.some((t, i) => t && texts.indexOf(t) !== i);
}

const byTicket = new Map();
for (const id of Object.keys(FIXES)) {
  const n = Number(id.match(/t_(\d+)_q_/)[1]);
  if (!byTicket.has(n)) byTicket.set(n, []);
  byTicket.get(n).push(id);
}

const changedIds = [];
for (const [n, ids] of byTicket) {
  const p = path.join(DST, `v${n}.json`);
  const arr = JSON.parse(fs.readFileSync(p, "utf8"));
  let changed = false;
  for (const id of ids) {
    const q = arr.find((x) => x.task_info.global_id === id);
    if (!q) throw new Error("missing " + id);
    const fix = FIXES[id];
    if (fix.opts) {
      q.content.ru.options = fix.opts.map((o) => ({ ...o }));
      if (hasDup(q.content.ru.options)) throw new Error("still dup " + id);
    }
    if (fix.izoh_ru) q.izoh.ru = fix.izoh_ru;
    if (fix.q_ru) q.content.ru.text = fix.q_ru;
    changedIds.push(id);
    changed = true;
  }
  if (changed) fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n", "utf8");
}

// sync barcha / barcha-ru for these ids
const byId = new Map();
for (const id of changedIds) {
  const n = Number(id.match(/t_(\d+)_q_/)[1]);
  const arr = JSON.parse(fs.readFileSync(path.join(DST, `v${n}.json`), "utf8"));
  byId.set(id, arr.find((x) => x.task_info.global_id === id));
}

for (const name of ["barcha.json", "barcha-ru.json"]) {
  const bp = path.join(ROOT, "public", name);
  const arr = JSON.parse(fs.readFileSync(bp, "utf8"));
  let n = 0;
  for (const q of arr) {
    const src = byId.get(q.task_info?.global_id);
    if (!src) continue;
    if (name === "barcha.json") {
      q.content.ru = JSON.parse(JSON.stringify(src.content.ru));
      q.izoh = { ...src.izoh };
    } else {
      q.content.ru = {
        text: src.content.ru.text,
        options: JSON.parse(JSON.stringify(src.content.ru.options)),
      };
      q.izoh = { ru: src.izoh?.ru || "" };
    }
    n++;
  }
  fs.writeFileSync(bp, JSON.stringify(arr, null, 4) + "\n", "utf8");
  console.log("synced", name, n);
}

console.log(JSON.stringify({ polished: changedIds.length, ids: changedIds }, null, 2));
