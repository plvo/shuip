'use client';

import * as React from 'react';

/** The view-transition name an example carries on its docs card and on its full page, which makes the two one element. */
const transitionNameOf = (registryName: string): string => `preview-${registryName.replaceAll('.', '--')}`;

export interface PreviewTransitionProps {
  registryName: string;
  /** Only the card the reader opened, and the full page, are named: two elements of one name break the transition. */
  named: boolean;
  children: React.ReactNode;
}

/** Makes the card of an example and its full page the same element for the browser to morph between. */
export function PreviewTransition({ registryName, named, children }: PreviewTransitionProps) {
  return (
    <React.ViewTransition
      name={named ? transitionNameOf(registryName) : undefined}
      share='preview-morph'
      default='none'
    >
      {children}
    </React.ViewTransition>
  );
}
