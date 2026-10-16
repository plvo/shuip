import { describe, expect, test } from 'bun:test';
import { createMorph, type MorphElement, type MorphEnvironment } from './morph-back';
import { MORPH_CLASS, transitionNameOf } from './preview-morph';

const NAME = transitionNameOf('copy-button.example');

const elementWithStyle = (): MorphElement & { properties: Map<string, string> } => {
  const properties = new Map<string, string>();
  return {
    properties,
    style: {
      setProperty: (name, value) => void properties.set(name, value),
      removeProperty: (name) => (properties.delete(name) ? '' : ''),
    },
  };
};

/** A browser that starts view transitions the test finishes, and timers the test fires. */
const fakeBrowser = (overrides: Partial<MorphEnvironment> = {}) => {
  const started: { released: Promise<void>; finish(): void }[] = [];
  const timers: { fire(): void; cancelled: boolean }[] = [];
  const environment: MorphEnvironment = {
    supportsViewTransitions: () => true,
    prefersReducedMotion: () => false,
    startViewTransition(update) {
      let finish = () => {};
      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });
      started.push({ released: update(), finish });
      return { finished };
    },
    after(_milliseconds, callback) {
      const timer = { fire: callback, cancelled: false };
      timers.push(timer);
      return () => {
        timer.cancelled = true;
      };
    },
    ...overrides,
  };
  return { environment, started, timers };
};

const settled = <T>(promise: Promise<T>) =>
  Promise.race([promise.then(() => true), new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 0))]);

const goBackSpy = () => {
  const calls = { count: 0 };
  return {
    calls,
    goBack: () => {
      calls.count += 1;
    },
  };
};

describe('morphBack without a morph to run', () => {
  test('goes back once, without a transition, when the browser has no view transitions', () => {
    const { environment, started } = fakeBrowser({ supportsViewTransitions: () => false });
    const { calls, goBack } = goBackSpy();
    const view = elementWithStyle();

    createMorph(environment).morphBack(view, 'copy-button.example', goBack);

    expect(calls.count).toBe(1);
    expect(started).toHaveLength(0);
    expect(view.properties.size).toBe(0);
  });

  test('goes back once, without a transition, when the reader prefers reduced motion', () => {
    const { environment, started } = fakeBrowser({ prefersReducedMotion: () => true });
    const { calls, goBack } = goBackSpy();
    const view = elementWithStyle();

    createMorph(environment).morphBack(view, 'copy-button.example', goBack);

    expect(calls.count).toBe(1);
    expect(started).toHaveLength(0);
    expect(view.properties.size).toBe(0);
  });

  test('goes back once, without a second transition, while a morph is already running', () => {
    const { environment, started } = fakeBrowser();
    const morph = createMorph(environment);
    const first = goBackSpy();
    const second = goBackSpy();

    morph.morphBack(elementWithStyle(), 'copy-button.example', first.goBack);
    morph.morphBack(elementWithStyle(), 'copy-button.example', second.goBack);

    expect(first.calls.count).toBe(1);
    expect(second.calls.count).toBe(1);
    expect(started).toHaveLength(1);
  });
});

describe('morphBack with a morph to run', () => {
  test('names the view for the browser and goes back once, inside the transition', () => {
    const { environment, started } = fakeBrowser();
    const { calls, goBack } = goBackSpy();
    const view = elementWithStyle();

    createMorph(environment).morphBack(view, 'copy-button.example', goBack);

    expect(started).toHaveLength(1);
    expect(calls.count).toBe(1);
    expect(view.properties.get('view-transition-name')).toBe(NAME);
    expect(view.properties.get('view-transition-class')).toBe(MORPH_CLASS);
  });

  test('holds the page on the old view until the card lands, then names the card and lets the page go', async () => {
    const { environment, started, timers } = fakeBrowser();
    const morph = createMorph(environment);
    const card = elementWithStyle();
    morph.morphBack(elementWithStyle(), 'copy-button.example', () => {});

    expect(await settled((started[0] as (typeof started)[number]).released)).toBe(false);
    morph.landMorph(card);

    expect(await settled((started[0] as (typeof started)[number]).released)).toBe(true);
    expect(card.properties.get('view-transition-name')).toBe(NAME);
    expect(card.properties.get('view-transition-class')).toBe(MORPH_CLASS);
    expect(timers[0]?.cancelled).toBe(true);
  });

  test('lets the page go after a second even if no card lands', async () => {
    const { environment, started, timers } = fakeBrowser();
    const morph = createMorph(environment);
    morph.morphBack(elementWithStyle(), 'copy-button.example', () => {});

    timers[0]?.fire();

    expect(await settled((started[0] as (typeof started)[number]).released)).toBe(true);
  });

  test('waits one second for the card', () => {
    const waits: number[] = [];
    const { environment } = fakeBrowser({
      after(milliseconds) {
        waits.push(milliseconds);
        return () => {};
      },
    });

    createMorph(environment).morphBack(elementWithStyle(), 'copy-button.example', () => {});

    expect(waits).toEqual([1000]);
  });

  test('clears the name of the card once the transition has finished', async () => {
    const { environment, started } = fakeBrowser();
    const morph = createMorph(environment);
    const card = elementWithStyle();
    morph.morphBack(elementWithStyle(), 'copy-button.example', () => {});
    morph.landMorph(card);

    (started[0] as (typeof started)[number]).finish();
    await Promise.resolve();
    await Promise.resolve();

    expect(card.properties.size).toBe(0);
  });

  test('is ready for the next morph once the transition has finished', async () => {
    const { environment, started } = fakeBrowser();
    const morph = createMorph(environment);
    morph.morphBack(elementWithStyle(), 'copy-button.example', () => {});

    (started[0] as (typeof started)[number]).finish();
    await Promise.resolve();
    await Promise.resolve();
    const next = goBackSpy();
    morph.morphBack(elementWithStyle(), 'copy-button.example', next.goBack);

    expect(started).toHaveLength(2);
    expect(next.calls.count).toBe(1);
  });
});

describe('landMorph', () => {
  test('does nothing when no morph is running', () => {
    const card = elementWithStyle();

    createMorph(fakeBrowser().environment).landMorph(card);

    expect(card.properties.size).toBe(0);
  });

  test('lands only the first card of a morph', () => {
    const { environment } = fakeBrowser();
    const morph = createMorph(environment);
    const first = elementWithStyle();
    const second = elementWithStyle();
    morph.morphBack(elementWithStyle(), 'copy-button.example', () => {});

    morph.landMorph(first);
    morph.landMorph(second);

    expect(first.properties.get('view-transition-name')).toBe(NAME);
    expect(second.properties.size).toBe(0);
  });

  test('does nothing once the transition has finished', async () => {
    const { environment, started } = fakeBrowser();
    const morph = createMorph(environment);
    const late = elementWithStyle();
    morph.morphBack(elementWithStyle(), 'copy-button.example', () => {});

    (started[0] as (typeof started)[number]).finish();
    await Promise.resolve();
    await Promise.resolve();
    morph.landMorph(late);

    expect(late.properties.size).toBe(0);
  });
});
