'use client';

import * as React from 'react';
import { ExpandButton } from './expand-button';
import { originOf, takeScrollToRestore, useOrigin } from './preview-origin';
import { PreviewTransition } from './preview-transition';

export interface PreviewCardProps {
  registryName: string;
  /** Tells apart the cards of one page that show the same example. */
  slot: string;
  href: string;
  label: string;
  children: React.ReactNode;
}

/** A preview with the button that opens it full page, and the morph that button starts. */
export function PreviewCard({ registryName, slot, href, label, children }: PreviewCardProps) {
  const origin = originOf(slot, registryName);
  const opened = useOrigin() === origin;

  const openedOnMount = React.useRef(opened);
  React.useLayoutEffect(() => {
    if (!openedOnMount.current) return;
    const scroll = takeScrollToRestore();
    if (scroll !== null) window.scrollTo({ top: scroll, behavior: 'instant' });
  }, []);

  return (
    <PreviewTransition registryName={registryName} named={opened}>
      <div className='relative'>
        {children}
        <ExpandButton href={href} label={label} origin={origin} />
      </div>
    </PreviewTransition>
  );
}
