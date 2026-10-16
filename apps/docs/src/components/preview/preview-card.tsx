'use client';

import * as React from 'react';
import { ExpandButton } from './expand-button';
import { landMorph } from './morph-back';
import { cardTransitionName, originOf, scrollToRestoreFor } from './preview-morph';
import { takeScrollToRestore, useOrigin } from './preview-origin';
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
  const origin = useOrigin();
  const originOnMount = React.useRef(origin);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLAnchorElement>(null);

  // A page that mounts with an origin is the one a full-page view closes to: the card the reader opened scrolls
  // back into place, takes the focus and meets the view in the transition.
  React.useLayoutEffect(() => {
    const scroll = scrollToRestoreFor(originOnMount.current, slot, registryName, takeScrollToRestore);
    if (scroll === null) return;
    window.scrollTo({ top: scroll, behavior: 'instant' });
    buttonRef.current?.focus({ preventScroll: true });
    if (cardRef.current) landMorph(cardRef.current);
  }, [slot, registryName]);

  return (
    <PreviewTransition name={cardTransitionName(origin, slot, registryName)}>
      <div ref={cardRef} className='relative'>
        {children}
        <ExpandButton ref={buttonRef} href={href} label={label} origin={originOf(slot, registryName)} />
      </div>
    </PreviewTransition>
  );
}
