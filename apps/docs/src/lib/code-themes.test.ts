import { describe, expect, test } from 'bun:test';
import { contrast, hexToRgb, MIN_TEXT_CONTRAST, tokenReader } from '@repo/ui/lib/contrast';
import { codeHighlightOptions } from './code-themes';

const light = tokenReader('root');
const codeBackgrounds = {
  'a code block': light.color('--card'),
  'a code block in a tab': light.color('--secondary'),
};

describe('the light theme of the code blocks', () => {
  const theme = codeHighlightOptions.themes.light;
  const colors = new Set((theme.tokenColors ?? []).flatMap(({ settings }) => settings?.foreground ?? []));
  colors.add(theme.colors?.['editor.foreground'] ?? '');

  test('colours the tokens of the theme', () => {
    expect(colors.size).toBeGreaterThan(5);
  });

  test.each(Object.entries(codeBackgrounds))('keeps every token colour readable on %s', (_, background) => {
    const unreadable = [...colors].filter(
      (color) => contrast(hexToRgb(color, background), background) < MIN_TEXT_CONTRAST,
    );

    expect(unreadable).toEqual([]);
  });
});
