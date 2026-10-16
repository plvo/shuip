import { useSyncExternalStore } from 'react';

export interface OriginStore {
  /** Records the card a full-page view is opened from, and how far the page is scrolled. */
  recordOpening(origin: string): void;
  /** The card the last full-page view was opened from, or null before any was. */
  origin(): string | null;
  /** The scroll position the page had when the view was opened, once: the page that returns takes it. */
  takeScrollToRestore(): number | null;
  subscribe(listener: () => void): () => void;
}

export const createOriginStore = (readScroll: () => number): OriginStore => {
  let origin: string | null = null;
  let scrollToRestore: number | null = null;
  const listeners = new Set<() => void>();

  return {
    recordOpening(next) {
      origin = next;
      scrollToRestore = readScroll();
      for (const listener of listeners) listener();
    },
    origin: () => origin,
    takeScrollToRestore() {
      const scroll = scrollToRestore;
      scrollToRestore = null;
      return scroll;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

const store = createOriginStore(() => window.scrollY);

export const recordOpening = store.recordOpening;

export const takeScrollToRestore = store.takeScrollToRestore;

/** The card the last full-page view was opened from in this tab, or null before any was. */
export const useOrigin = (): string | null => useSyncExternalStore(store.subscribe, store.origin, () => null);
