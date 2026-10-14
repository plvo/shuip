import { describe, expect, test } from 'bun:test';
import { resolveBaseOnly } from './base-only';

const MARKDOWN = [
  'Intro.',
  '',
  '<BaseOnly base="radix">',
  '',
  '```tsx',
  '<Trigger asChild><Button /></Trigger>',
  '```',
  '',
  '</BaseOnly>',
  '',
  '<BaseOnly base="base">',
  '',
  '```tsx',
  '<Trigger render={<Button />} />',
  '```',
  '',
  '</BaseOnly>',
  '',
  'Outro.',
].join('\n');

describe('resolveBaseOnly', () => {
  test('keeps the branch of the base and drops the others', () => {
    const resolved = resolveBaseOnly(MARKDOWN, 'base');

    expect(resolved).toContain('render={<Button />}');
    expect(resolved).not.toContain('asChild');
  });

  test('keeps the Radix branch for the Radix base', () => {
    const resolved = resolveBaseOnly(MARKDOWN, 'radix');

    expect(resolved).toContain('asChild');
    expect(resolved).not.toContain('render=');
  });

  test('leaves no wrapper tag behind', () => {
    expect(resolveBaseOnly(MARKDOWN, 'base')).not.toContain('BaseOnly');
    expect(resolveBaseOnly(MARKDOWN, 'radix')).not.toContain('BaseOnly');
  });

  test('keeps the text around the branches', () => {
    const resolved = resolveBaseOnly(MARKDOWN, 'base');

    expect(resolved.startsWith('Intro.')).toBe(true);
    expect(resolved.endsWith('Outro.')).toBe(true);
  });

  test('returns markdown without branches unchanged', () => {
    expect(resolveBaseOnly('Plain text.', 'base')).toBe('Plain text.');
  });
});
