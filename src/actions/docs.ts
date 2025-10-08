'use server';

import fs from 'node:fs';
import path from 'node:path';
import { type ParsedFrontmatterReturn, parseFrontmatter } from '@/lib/utils';

interface PathWithMetadata {
  path: string;
  metadata: ParsedFrontmatterReturn['metadata'];
}

export type PathsByCategory = Record<string, PathWithMetadata[]>;

interface PathsByCategoryReturn {
  allPaths: string[];
  pathsByCategory: PathsByCategory;
}

export async function getPathsByCategory(): Promise<PathsByCategoryReturn> {
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

  const allPaths = [
    '/',
    ...Object.values(pathsByCategory)
      .flat()
      .map((path) => path.path),
  ];

  return { pathsByCategory, allPaths };
}

export async function getRegistryPath(filename: string, type: string): Promise<string | null> {
  const registryType = ['ui', 'lib', 'block', 'actions'].includes(type) ? type : 'ui';
  return path.join(process.cwd(), 'registry', registryType, `rhf-${filename}.tsx`);
}

export async function getRegistryContent(registryPath: string): Promise<string | null> {
  try {
    return fs.readFileSync(path.join(process.cwd(), registryPath), 'utf8');
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getExamples(filename: string): Promise<string[]> {
  return fs.readdirSync(path.join(process.cwd(), 'examples')).filter((file) => file.includes(filename));
}
