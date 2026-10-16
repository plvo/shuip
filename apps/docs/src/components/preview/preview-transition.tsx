'use client';

import * as React from 'react';

export interface PreviewTransitionProps {
  /** The view-transition name, which the card of an example and its full page share; unnamed takes no part. */
  name: string | undefined;
  children: React.ReactNode;
}

/** Makes the card of an example and its full page the same element for the browser to morph between. */
export function PreviewTransition({ name, children }: PreviewTransitionProps) {
  return (
    <React.ViewTransition name={name} share='preview-morph' default='none'>
      {children}
    </React.ViewTransition>
  );
}
