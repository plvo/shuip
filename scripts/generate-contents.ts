import fs from 'fs';
import path from 'path';

export const getComponentsGroups = (): Array<string> => {
  const dirPath = path.join(process.cwd(), 'public/r');

  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const registryFiles = fs.readdirSync(dirPath);
  return [...new Set(registryFiles.map((r) => r.split('.')[0]))];
};

export const getComponentsByGroup = (group: string): Array<string> => {
  const registryFiles = fs.readdirSync('./public/r');
  return registryFiles.filter((r) => r.startsWith(`${group}.`));
};

async function main() {
  const groups: Array<string> = getComponentsGroups();

  const res = [
    ...groups.map((g) => {
      const comps = getComponentsByGroup(g);

      return { [g]: comps };
    }),
  ];

  fs.writeFileSync('./src/content/comp-groups.json', JSON.stringify(res, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
