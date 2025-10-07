'use server';

import fs from 'node:fs';
import path from 'node:path';

export async function getPathsByCategory(): Promise<{ pathsByCategory: Record<string, string[]>; allPaths: string[] }> {
  const contentDirs = fs.readdirSync(path.join(process.cwd(), 'content'));
  const pathsByCategory: Record<string, string[]> = {};
  for (const dir of contentDirs) {
    const files = fs.readdirSync(path.join(process.cwd(), 'content', dir), { withFileTypes: true });
    const paths = files.map((file) => `/${dir}/${file.name.replace('.mdx', '')}`);
    pathsByCategory[dir] = paths;
  }

  const allPaths = ['/', ...Object.values(pathsByCategory).flat()];

  return { pathsByCategory, allPaths };
}
