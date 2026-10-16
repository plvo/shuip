'use client';

import { Maximize2Icon } from 'lucide-react';
import Link from 'next/link';
import type * as React from 'react';
import { rememberOrigin } from './preview-origin';

export interface ExpandButtonProps {
  href: string;
  /** The accessible name, which says which example the button opens. */
  label: string;
  origin: string;
}

const opensInThisTab = (event: React.MouseEvent) =>
  event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

/** Sits in the top-right corner of a preview card and opens the example full page. */
export function ExpandButton({ href, label, origin }: ExpandButtonProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      onClick={(event) => opensInThisTab(event) && rememberOrigin(origin)}
      className='absolute top-1 right-1 z-10 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring'
    >
      <Maximize2Icon aria-hidden className='size-3.5' />
    </Link>
  );
}
