import { readdirSync } from 'node:fs';

const registryfiles = readdirSync('./public/r/');

console.log(registryfiles);

for (const file of registryfiles) {
  console.log('bun x shadcn@latest add http://localhost:3000/r/' + file);
}
