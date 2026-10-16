import { describe, expect, test } from 'bun:test';
import { createOriginStore } from './preview-origin';

const storeAt = (scroll: { y: number }) => createOriginStore(() => scroll.y);

describe('the origin store', () => {
  test('has no origin before a view was opened', () => {
    expect(storeAt({ y: 0 }).origin()).toBeNull();
  });

  test('remembers the card a view was opened from', () => {
    const store = storeAt({ y: 0 });

    store.recordOpening('page:copy-button.example');

    expect(store.origin()).toBe('page:copy-button.example');
  });

  test('captures how far the page was scrolled when the view was opened', () => {
    const scroll = { y: 640 };
    const store = storeAt(scroll);

    store.recordOpening('page:copy-button.example');
    scroll.y = 0;

    expect(store.takeScrollToRestore()).toBe(640);
  });

  test('hands the scroll position out once, then null', () => {
    const store = storeAt({ y: 640 });
    store.recordOpening('page:copy-button.example');

    store.takeScrollToRestore();

    expect(store.takeScrollToRestore()).toBeNull();
  });

  test('has no scroll position to hand out before a view was opened', () => {
    expect(storeAt({ y: 640 }).takeScrollToRestore()).toBeNull();
  });

  test('keeps the origin after the scroll position was taken, for the page that closes to it', () => {
    const store = storeAt({ y: 640 });
    store.recordOpening('page:copy-button.example');

    store.takeScrollToRestore();

    expect(store.origin()).toBe('page:copy-button.example');
  });

  test('notifies subscribers when a view is opened, until they unsubscribe', () => {
    const store = storeAt({ y: 0 });
    let notified = 0;
    const unsubscribe = store.subscribe(() => {
      notified += 1;
    });

    store.recordOpening('page:a.example');
    store.recordOpening('page:b.example');
    unsubscribe();
    store.recordOpening('page:c.example');

    expect(notified).toBe(2);
  });
});
