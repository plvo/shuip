import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { MdxFrontmatter, ParsedFrontmatterReturn } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * @example firstCharUppercase('hello') // Hello
 */
export function firstCharUppercase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
/**
 * @example filenameToTitle('my-file-name') // My File Name
 */
export function filenameToTitle(filename: string) {
  return filename
    .split('-')
    .map((w) => firstCharUppercase(w))
    .join(' ');
}

/**
 * @example titleToFilename('My File Name') // my-file-name
 */
export function titleToFilename(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// https://github.com/shadcn/leerob.io/blob/main/app/db/blog.ts#L58
export function parseFrontmatter(fileContent: string): ParsedFrontmatterReturn {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  // biome-ignore lint/style/noNonNullAssertion: ok
  const frontMatterBlock = match![1];
  const mdxContent = fileContent.replace(frontmatterRegex, '').trim();
  const frontMatterLines = frontMatterBlock.trim().split('\n');
  const metadata: Partial<MdxFrontmatter> = {};

  frontMatterLines.forEach((line) => {
    const [key, ...valueArr] = line.split(': ');
    let value = valueArr.join(': ').trim();
    value = value.replace(/^['"](.*)['"]$/, '$1'); // Remove quotes
    metadata[key.trim() as keyof MdxFrontmatter] = value;
  });

  return { metadata, mdxContent };
}

/**
 * @returns [category, name]
 */
export function processSlug(slug: string[] | string): [string, string] {
  if (typeof slug === 'string') {
    slug = slug.split('/');
  }
  return [slug[0], slug[1] ?? 'index'];
}
