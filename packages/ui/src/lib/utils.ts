import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
