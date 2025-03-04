import { clsx, type ClassValue } from 'clsx';
import { allComponents, allDocs, Component, Docs } from 'contentlayer/generated';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
}

export function stringToUppercase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * TODO: need to change this
 * it's horrible
 * @param slugPath: path of the page
 * @returns the doc object
 */
export function findDocContent(slugPath: string): Docs | undefined {
  return allDocs.find((doc) => {
    if (doc.slug.startsWith('docs/')) {
      return doc.slug.slice(5) === slugPath;
    }
    return doc.slug.slice(4) === slugPath;
  });
}

export function findComponentContent(slugPath: string): Component | undefined {
  const completeSlugPath = `components/${slugPath}`;
  return allComponents.find((doc) => doc.slug === completeSlugPath);
}
