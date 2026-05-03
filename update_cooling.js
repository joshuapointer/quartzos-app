const fs = require('fs');

const bangersJson = JSON.parse(fs.readFileSync('docs/perfect_dab/bangers.json', 'utf8'));
const coolingMap = {};
for (const b of bangersJson) {
  coolingMap[b.id] = b.cooling;
}

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('interface BangerBase')) {
    content = content.replace(
      /readonly cooldown_seconds: string;/g,
      "readonly cooldown_seconds: string;\n  readonly cooling: { readonly k_per_second: number | null; readonly thermal_class: string };"
    );
  }
  
  const idRegex = /id:\s*'([^']+)'/g;
  let match;
  let newContent = content;
  
  while ((match = idRegex.exec(content)) !== null) {
    const id = match[1];
    if (coolingMap[id]) {
      const k = coolingMap[id].k_per_second;
      const t = coolingMap[id].thermal_class;
      const kStr = k === null ? 'null' : k;
      const injectStr = `cool_seconds: `;
      if (file.includes('flow/data')) {
        newContent = newContent.replace(
          new RegExp(`id:\\s*'${id}'[\\s\\S]*?cool_seconds:\\s*\\[\\d+,\\s*\\d+\\]`),
          `$&,\n    cooling: { k_per_second: ${kStr}, thermal_class: '${t}' }`
        );
      } else {
        newContent = newContent.replace(
          new RegExp(`id:\\s*'${id}'[\\s\\S]*?cooldown_seconds:\\s*'[^']+'`),
          `$&,\n    cooling: { k_per_second: ${kStr}, thermal_class: '${t}' }`
        );
      }
    }
  }
  fs.writeFileSync(file, newContent);
}

patchFile('src/data/bangers.ts');
console.log('patched src/data/bangers.ts');
patchFile('src/flow/data/bangers.ts');
console.log('patched src/flow/data/bangers.ts');
