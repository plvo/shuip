import { MORPH_CLASS, transitionNameOf } from './preview-morph';

const COMMIT_TIMEOUT_MS = 1000;

/** The part of an element a transition names: its inline style. */
export interface MorphElement {
  style: Pick<CSSStyleDeclaration, 'setProperty' | 'removeProperty'>;
}

/** What a morph needs of the browser, so that it can be run against another one. */
export interface MorphEnvironment {
  supportsViewTransitions(): boolean;
  prefersReducedMotion(): boolean;
  /** Starts a view transition that waits for `update` before it captures the new state. */
  startViewTransition(update: () => Promise<void>): { finished: Promise<unknown> };
  /** Runs `callback` after `milliseconds`, and returns the function that cancels it. */
  after(milliseconds: number, callback: () => void): () => void;
}

const browser: MorphEnvironment = {
  supportsViewTransitions: () => typeof document.startViewTransition === 'function',
  prefersReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  startViewTransition: (update) => document.startViewTransition(update),
  after(milliseconds, callback) {
    const timer = window.setTimeout(callback, milliseconds);
    return () => window.clearTimeout(timer);
  },
};

const nameElement = (element: MorphElement, name: string) => {
  element.style.setProperty('view-transition-name', name);
  element.style.setProperty('view-transition-class', MORPH_CLASS);
};

const unnameElement = (element: MorphElement) => {
  element.style.removeProperty('view-transition-name');
  element.style.removeProperty('view-transition-class');
};

export const createMorph = (environment: MorphEnvironment) => {
  let landing: ((card: MorphElement) => void) | null = null;
  let morphing = false;

  const takeLanding = () => {
    const land = landing;
    landing = null;
    return land;
  };

  /**
   * Goes back to the page that opened a full-page view, as a view transition from the view to the card it was
   * opened from. React starts no transition for a history traversal, so the browser's own is started here, around
   * the navigation: the view is named before it starts, and the card names itself with `landMorph` once it is back
   * in place. The page holds on the old view until then, or for a second at most. The browser's own Back button
   * cannot be wrapped the same way: React updates the page in the same task as the traversal, before the browser
   * captures the old state, so there is nothing left to morph from.
   */
  const morphBack = (view: MorphElement, registryName: string, goBack: () => void): void => {
    if (morphing || !environment.supportsViewTransitions() || environment.prefersReducedMotion()) {
      goBack();
      return;
    }
    const name = transitionNameOf(registryName);
    let landedCard: MorphElement | null = null;
    morphing = true;
    nameElement(view, name);

    const transition = environment.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          const cancelGiveUp = environment.after(COMMIT_TIMEOUT_MS, resolve);
          landing = (card) => {
            cancelGiveUp();
            landedCard = card;
            nameElement(card, name);
            resolve();
          };
          goBack();
        }),
    );

    transition.finished.finally(() => {
      morphing = false;
      takeLanding();
      if (landedCard) unnameElement(landedCard);
    });
  };

  /** Called by the card a full-page view returns to, once it is in the page and scrolled into place. */
  const landMorph = (card: MorphElement): void => takeLanding()?.(card);

  return { morphBack, landMorph };
};

export const { morphBack, landMorph } = createMorph(browser);
