'use client';

import { useSyncExternalStore } from 'react';

/** Names one preview card of a page. A page can show the same example twice, so the example alone does not. */
export const originOf = (slot: string, registryName: string): string => `${slot}:${registryName}`;

let origin: string | null = null;
let scrollToRestore: number | null = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Remembers the card a full-page view was opened from, so that the card, and no other, takes part in the morph,
 * and how far the page was scrolled, so that the card is in sight again when the view closes.
 */
export const rememberOrigin = (next: string): void => {
  origin = next;
  scrollToRestore = window.scrollY;
  for (const listener of listeners) listener();
};

/** The scroll position the docs page had when the view was opened, once: the page that returns takes it. */
export const takeScrollToRestore = (): number | null => {
  const scroll = scrollToRestore;
  scrollToRestore = null;
  return scroll;
};

/** The card the last full-page view was opened from in this tab, or null before any was. */
export const useOrigin = (): string | null =>
  useSyncExternalStore(
    subscribe,
    () => origin,
    () => null,
  );
