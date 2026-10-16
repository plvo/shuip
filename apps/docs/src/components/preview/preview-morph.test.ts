import { describe, expect, test } from 'bun:test';
import { cardTransitionName, closesOnEscape, originOf, scrollToRestoreFor, transitionNameOf } from './preview-morph';

const CARDS = [
  { slot: 'header', registryName: 'copy-button.example' },
  { slot: 'page', registryName: 'copy-button.example' },
  { slot: 'page', registryName: 'copy-button.with-custom-icons.example' },
];

describe('the transition name of a card', () => {
  const opened = originOf('page', 'copy-button.example');
  const names = CARDS.map(({ slot, registryName }) => cardTransitionName(opened, slot, registryName));

  test('is carried by the card the reader opened', () => {
    expect(names[1]).toBe(transitionNameOf('copy-button.example'));
  });

  test('is carried by no other card, even one that shows the same example', () => {
    expect(names.filter((name) => name !== undefined)).toHaveLength(1);
    expect(names[0]).toBeUndefined();
    expect(names[2]).toBeUndefined();
  });

  test('is carried by no card before a view was opened', () => {
    for (const { slot, registryName } of CARDS) expect(cardTransitionName(null, slot, registryName)).toBeUndefined();
  });

  test('is a valid identifier for every example, dots included', () => {
    expect(transitionNameOf('copy-button.with-custom-icons.example')).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  test('differs between examples, so a full page pairs with its own card only', () => {
    expect(transitionNameOf('copy-button.example')).not.toBe(transitionNameOf('copy-button.with-custom-icons.example'));
  });
});

describe('the scroll position a card restores', () => {
  const opened = originOf('page', 'copy-button.example');

  test('is taken by the card the reader opened', () => {
    expect(scrollToRestoreFor(opened, 'page', 'copy-button.example', () => 640)).toBe(640);
  });

  test('is left alone by every other card', () => {
    let taken = 0;
    const take = () => {
      taken += 1;
      return 640;
    };

    expect(scrollToRestoreFor(opened, 'header', 'copy-button.example', take)).toBeNull();
    expect(scrollToRestoreFor(opened, 'page', 'side-dialog.example', take)).toBeNull();
    expect(scrollToRestoreFor(null, 'page', 'copy-button.example', take)).toBeNull();
    expect(taken).toBe(0);
  });
});

describe('closing on Escape', () => {
  test('closes on Escape', () => {
    expect(closesOnEscape({ key: 'Escape', defaultPrevented: false })).toBe(true);
  });

  test('leaves Escape to whatever already handled it, such as an open dialog', () => {
    expect(closesOnEscape({ key: 'Escape', defaultPrevented: true })).toBe(false);
  });

  test('ignores every other key', () => {
    expect(closesOnEscape({ key: 'Enter', defaultPrevented: false })).toBe(false);
  });
});
