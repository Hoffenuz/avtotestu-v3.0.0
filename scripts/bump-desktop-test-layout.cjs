const fs = require("fs");

const files = [
  "src/components/TestInterface.tsx",
  "src/components/TestInterfaceBase.tsx",
  "src/components/TestInterfaceCombined.tsx",
  "src/components/MavzuliTestInterface.tsx",
];

const replacements = [
  ["md:w-[60%] md:flex-shrink-0", "md:w-[48%] md:flex-shrink-0"],
  ["hidden md:block md:w-[40%] md:flex-shrink-0", "hidden md:block md:w-[52%] md:flex-shrink-0"],
  ["md:flex md:gap-8 md:items-start", "md:flex md:gap-5 md:items-start"],
  [
    "text-base md:text-lg font-medium text-foreground leading-relaxed",
    "text-base md:text-[15px] font-medium text-foreground leading-relaxed",
  ],
  [
    '<span className="text-base md:text-base font-medium">{answer.text}</span>',
    '<span className="text-base md:text-sm font-medium">{answer.text}</span>',
  ],
  [
    '<span className="text-sm md:text-base">{answer.text}</span>',
    '<span className="text-sm md:text-sm">{answer.text}</span>',
  ],
  [
    'Card className="p-4 bg-card border-border overflow-hidden sticky top-4"',
    'Card className="p-3 bg-card border-border overflow-hidden sticky top-4"',
  ],
];

for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const before = s;
  for (const [a, b] of replacements) s = s.split(a).join(b);
  if (s !== before) {
    fs.writeFileSync(f, s);
    console.log("updated", f);
  } else {
    console.log("unchanged", f);
  }
}
