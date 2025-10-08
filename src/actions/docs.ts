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

export async function getContentByFilePath(filePath: string): Promise<string> {
  return fs.readFileSync(path.join(process.cwd(), filePath.split('#/')[1]), 'utf8');
}

export async function getExamplesByFilePath(filePath: string): Promise<string[]> {
  const filename = path.basename(filePath).split('.')[0];

  const allExamples = [];

  const examplesDir = path.join(process.cwd(), 'examples');
  const exampleDirs = fs
    .readdirSync(examplesDir, { withFileTypes: true })
    .filter((dirent) => (dirent.isDirectory() ? true : dirent.name.includes(filename)))
    .map((dirent) => dirent.name);

  for (const dir of exampleDirs) {
    const files = fs.readdirSync(path.join(examplesDir, dir));
    allExamples.push(...files.map((file) => path.join('examples', dir, file)));
  }

  return allExamples.filter((example) => example.includes(filename));
}
