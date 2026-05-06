import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function firstCharUppercase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function filenameToTitle(filename: string) {
  return filename
    .split('-')
    .map((w) => firstCharUppercase(w))
    .join(' ');
}

export function titleToFilename(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function processSlug(slug: string[] | string): [string, string] {
  if (typeof slug === 'string') {
    slug = slug.split('/');
  }
  return [slug[0], slug[1] ?? 'index'];
}
