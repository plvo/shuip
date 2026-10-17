import { describe, expect, test } from 'bun:test';
import { compositeOver, contrast, MIN_TEXT_CONTRAST, type Rgb, tokenReader } from '@repo/ui/scripts/contrast';
import { codeHighlightOptions } from './code-themes';

const rgbOfHex = (hex: string): Rgb => {
  const channels = hex.slice(1).match(/../g) ?? [];
  return channels.slice(0, 3).map((channel) => Number.parseInt(channel, 16) / 255) as unknown as Rgb;
};

const opaque = (hex: string): Rgb => {
  const alpha = hex.length === 9 ? Number.parseInt(hex.slice(7), 16) / 255 : 1;
  return compositeOver(rgbOfHex(hex), [1, 1, 1], alpha);
};

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
    const unreadable = [...colors].filter((color) => contrast(opaque(color), background) < MIN_TEXT_CONTRAST);

    expect(unreadable).toEqual([]);
  });
});
