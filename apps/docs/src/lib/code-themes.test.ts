import { describe, expect, test } from 'bun:test';
import { contrast, hexToRgb, MIN_TEXT_CONTRAST, tokenReader } from '@repo/ui/lib/contrast';
import { codeHighlightOptions } from './code-themes';

const modes = {
  light: tokenReader('root'),
  dark: tokenReader('dark'),
};

describe.each(['light', 'dark'] as const)('the %s theme of the code blocks', (mode) => {
  const theme = codeHighlightOptions.themes[mode];
  const editorForeground = theme.colors?.['editor.foreground'];
  const colors = new Set((theme.tokenColors ?? []).flatMap(({ settings }) => settings?.foreground ?? []));
  if (editorForeground) colors.add(editorForeground);
  const codeBackgrounds = {
    'a code block': modes[mode].color('--card'),
    'a code block in a tab': modes[mode].color('--secondary'),
  };

  test('colours the tokens of the theme', () => {
    expect(editorForeground).toMatch(/^#[0-9a-f]{6}$/i);
    expect(colors.size).toBeGreaterThan(5);
  });

  test.each(Object.entries(codeBackgrounds))('keeps every token colour readable on %s', (_, background) => {
    const unreadable = [...colors].filter(
      (color) => contrast(hexToRgb(color, background), background) < MIN_TEXT_CONTRAST,
    );

    expect(unreadable).toEqual([]);
  });
});
