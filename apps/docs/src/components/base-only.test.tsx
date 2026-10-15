import { describe, expect, test } from 'bun:test';
import { BaseOnly } from './base-only';

describe('BaseOnly', () => {
  test('renders its content on the base it is written for', () => {
    expect(BaseOnly({ base: 'radix', activeBase: 'radix', children: 'asChild snippet' })).toBe('asChild snippet');
  });

  test('renders nothing on another base', () => {
    expect(BaseOnly({ base: 'radix', activeBase: 'base', children: 'asChild snippet' })).toBeNull();
    expect(BaseOnly({ base: 'base', activeBase: 'radix', children: 'render snippet' })).toBeNull();
  });
});
