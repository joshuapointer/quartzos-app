const fs = require('fs');
let content = fs.readFileSync('src/flow/data/types.ts', 'utf8');
content = content.replace(
  /cool_seconds: \[number, number\];/g,
  "cool_seconds: [number, number];\n  cooling?: { k_per_second: number | null; thermal_class: string };"
);
fs.writeFileSync('src/flow/data/types.ts', content);
