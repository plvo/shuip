import { transitionNameOf } from './preview-morph';

const COMMIT_TIMEOUT_MS = 1000;
const MORPH_CLASS = 'preview-morph';

interface Landing {
  land(card: HTMLElement): void;
}

let landing: Landing | null = null;
let morphing = false;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const nameElement = (element: HTMLElement, name: string) => {
  element.style.viewTransitionName = name;
  element.style.setProperty('view-transition-class', MORPH_CLASS);
};

const unnameElement = (element: HTMLElement) => {
  element.style.removeProperty('view-transition-name');
  element.style.removeProperty('view-transition-class');
};

/**
 * Goes back to the page that opened a full-page view, as a view transition from the view to the card it was opened
 * from. React starts no transition for a history traversal, so the browser's own is started here, around the
 * navigation: the view is named before it starts, and the card names itself with `landMorph` once it is back in
 * place. The page holds on the old view until then, or for a second at most. The browser's own Back button cannot be
 * wrapped the same way: React updates the page in the same task as the traversal, before the browser captures the old
 * state, so there is nothing left to morph from.
 */
export const morphBack = (view: HTMLElement, registryName: string, goBack: () => void): void => {
  if (morphing || !document.startViewTransition || prefersReducedMotion()) {
    goBack();
    return;
  }
  const name = transitionNameOf(registryName);
  let card: HTMLElement | null = null;
  morphing = true;
  nameElement(view, name);

  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const giveUp = window.setTimeout(resolve, COMMIT_TIMEOUT_MS);
        landing = {
          land(landed) {
            window.clearTimeout(giveUp);
            card = landed;
            nameElement(landed, name);
            resolve();
          },
        };
        goBack();
      }),
  );

  transition.finished.finally(() => {
    morphing = false;
    landing = null;
    if (card) unnameElement(card);
  });
};

/** Called by the card a full-page view returns to, once it is in the page and scrolled into place. */
export const landMorph = (card: HTMLElement): void => {
  landing?.land(card);
  landing = null;
};
