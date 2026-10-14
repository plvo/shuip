import type React from 'react';
import type { Base } from '@/lib/base-routes';

export interface BaseOnlyProps {
  /** The base the content is written for. */
  base: Base;
  /** The base of the page being rendered. */
  activeBase: Base;
  children: React.ReactNode;
}

/** Prose and snippets that only hold for one base, such as `asChild` composition on Radix. */
export function BaseOnly({ base, activeBase, children }: BaseOnlyProps) {
  return base === activeBase ? children : null;
}
