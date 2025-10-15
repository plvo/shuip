import fs from 'node:fs';
import path from 'node:path';
import registry from '../registry.json';

for (const item of registry.items) {
  for (const file of item.files) {
    const registryPath = path.join(process.cwd(), file.path);
    const targetPath = path.join(process.cwd(), 'src', file.target);
    fs.copyFileSync(registryPath, targetPath);
    console.log(`Copied ${path.basename(registryPath)} to ${path.basename(targetPath)}`);
  }
}
