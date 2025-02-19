import fs from 'fs';

export const getComponentsGroups = (): Array<string> => {
  const registryFiles = fs.readdirSync('./public/r');
  return Array.from(
    new Set(
      registryFiles.map((r) => {
        return r.split('.')[0];
      }),
    ),
  );
};

export const getComponentsByGroup = (group: string): Array<string> => {
  const registryFiles = fs.readdirSync('./public/r');
  return registryFiles.filter((r) => r.startsWith(`${group}.`));
};
