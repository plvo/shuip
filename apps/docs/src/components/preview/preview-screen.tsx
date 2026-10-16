'use client';

import { XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { morphBack } from './morph-back';
import { closesOnEscape, transitionNameOf } from './preview-morph';
import { useOrigin } from './preview-origin';
import { PreviewTransition } from './preview-transition';

export interface PreviewScreenProps {
  registryName: string;
  title: string;
  exampleTitle: string;
  /** The docs page the view closes to when it was not opened from it. */
  docsUrl: string;
  children: React.ReactNode;
}

/**
 * An example alone on its page, with the button and the Escape key that close it. A view opened from a card goes
 * back to the page of that card; one opened on its own, from a link or a reload, goes to the docs page of the item.
 */
export function PreviewScreen({ registryName, title, exampleTitle, docsUrl, children }: PreviewScreenProps) {
  const router = useRouter();
  const openedFromCard = useOrigin() !== null;
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const viewRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => headingRef.current?.focus({ preventScroll: true }), []);

  const close = React.useCallback(() => {
    if (openedFromCard && viewRef.current) morphBack(viewRef.current, registryName, () => router.back());
    else router.push(docsUrl, { scroll: false });
  }, [openedFromCard, registryName, router, docsUrl]);

  React.useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (closesOnEscape(event)) close();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [close]);

  return (
    <main className='flex min-h-dvh flex-col gap-3 p-3 sm:p-4'>
      <header className='flex items-center justify-between gap-3'>
        <h1 ref={headingRef} tabIndex={-1} className='min-w-0 font-mono text-lg font-semibold outline-none'>
          {title}
          <span aria-hidden className='px-2 text-muted-foreground'>
            /
          </span>
          <span className='sr-only'>, </span>
          <span className='text-muted-foreground'>{exampleTitle}</span>
        </h1>
        <button
          type='button'
          onClick={close}
          className='flex h-9 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
        >
          <XIcon aria-hidden className='size-4' />
          Close
        </button>
      </header>
      <PreviewTransition name={transitionNameOf(registryName)}>
        <div ref={viewRef} className='flex min-h-0 flex-1 flex-col'>
          {children}
        </div>
      </PreviewTransition>
    </main>
  );
}
