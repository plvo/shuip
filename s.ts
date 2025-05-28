import fs from 'node:fs';
import path from 'node:path';

const publicFiles = path.join(process.cwd(), 'public', 'r');

const files = fs.readdirSync(publicFiles);

for (const file of files) {
  console.log(`bun x shadcn@latest add http://localhost:3000/r/${file}`);
}
