'use server';

import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '@/lib/utils';
import type { ParsedFrontmatterReturn } from '@/types';

interface PathWithMetadata {
  path: string;
  metadata: ParsedFrontmatterReturn['metadata'];
}

export type PathsByCategory = Record<string, PathWithMetadata[]>;

export async function getPathsByCategory(): Promise<PathsByCategory> {
  const contentDirs = fs.readdirSync(path.join(process.cwd(), 'content'));
  const pathsByCategory: Record<string, PathWithMetadata[]> = {};

  for (const dir of contentDirs) {
    const files = fs.readdirSync(path.join(process.cwd(), 'content', dir), { withFileTypes: true });

    const paths: PathWithMetadata[] = files.map((file) => {
      const fileContent = fs.readFileSync(path.join(process.cwd(), 'content', dir, file.name), 'utf8');

      return {
        path: `/${dir}/${file.name.replace('.mdx', '')}`,
        metadata: parseFrontmatter(fileContent).metadata,
      };
    });

    pathsByCategory[dir] = paths;
  }

  return pathsByCategory;
}
