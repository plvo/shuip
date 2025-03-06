import { clsx, type ClassValue } from 'clsx';
import { allComponents, type Component } from 'contentlayer/generated';
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

export function findComponentContent(slugPath: string): Component | undefined {
  const completeSlugPath = `components/${slugPath}`;
  return allComponents.find((doc) => doc.slug === completeSlugPath);
}

export function filenameToTitle(filename: string) {
  return filename
    .split('.')
    .map((w) => stringToUppercase(w))
    .join(' ');
}
