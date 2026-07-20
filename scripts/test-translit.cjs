const { toCyrillic } = require("./uz-translit.cjs");
const samples = [
  "YHQ 1-ilovasi 3-bo'limi 3-xatboshiga asosan, Qoidalarning 176-bandiga binoan \"Nogiron\" taniqlik belgisi bilan belgilangan avtomobillar va kajavali motosikllarni boshqarayotgan nogiron haydovchilarga 7.18 \"Nogironlar mustasno\" belgi bo'lganda 3.27 \"To'xtash taqiqlangan\" belgisining ta'sir doirasida to'xtashga ruxsat etiladi.",
  "Yo'l harakati qoidalariga muvofiq, chorrahaga yaqinlashganda haydovchi tezlikni kamaytirishi shart. E'tibor bering: yelkasida yuk bor.",
  "Svetoforning yashil chirog'i yonganda ekipaj a'zolari harakatni boshlashi mumkin. Masalan sentabr oyida yomg'ir ko'p yog'adi.",
  "Ushbu yo'l chizig'i 1.16.1-chiziq bo'lib, oqimlarni ajratish joylarini bildiradi. Quyosh energiyasi elektr toki manbai.",
];
for (const s of samples) {
  console.log(toCyrillic(s));
  console.log("---");
}
