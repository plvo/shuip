'use client';

import { XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { PreviewTransition } from './preview-transition';

export interface PreviewScreenProps {
  registryName: string;
  title: string;
  exampleTitle: string;
  /** The docs page the view closes to when it was not opened from it. */
  docsUrl: string;
  children: React.ReactNode;
}

/** An example alone on its page, with the controls that close it: the button, Escape and the browser's Back. */
export function PreviewScreen({ registryName, title, exampleTitle, docsUrl, children }: PreviewScreenProps) {
  const router = useRouter();

  const close = React.useCallback(() => router.push(docsUrl, { scroll: false }), [router, docsUrl]);

  React.useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) close();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [close]);

  return (
    <div className='flex min-h-dvh flex-col gap-3 p-3 sm:p-4'>
      <header className='flex items-center justify-between gap-3'>
        <h1 className='min-w-0 font-mono text-lg font-semibold'>
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
      <PreviewTransition registryName={registryName} named>
        <div className='flex min-h-0 flex-1 flex-col'>{children}</div>
      </PreviewTransition>
    </div>
  );
}
