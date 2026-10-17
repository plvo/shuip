import { bundledThemes, type ThemeRegistration } from 'shiki';

/** The github-light colours under 4.5:1 on the code block backgrounds, each with the same hue, darker. */
const READABLE_COLORS: Record<string, string> = {
  '#6a737d': '#606871',
  '#22863a': '#1e7734',
  '#d73a49': '#c52837',
  '#e36209': '#ac4a07',
  '#fafbfc': '#506a85',
  '#f6f8fa': '#4c6a89',
};

const readable = (color: string | undefined): string | undefined =>
  color && (READABLE_COLORS[color.toLowerCase()] ?? color);

const { default: githubLight } = await bundledThemes['github-light']();

const lightTheme: ThemeRegistration = {
  ...githubLight,
  name: 'shuip-light',
  tokenColors: githubLight.tokenColors?.map(({ settings, ...rule }) => ({
    ...rule,
    settings: { ...settings, foreground: readable(settings?.foreground) },
  })),
};

/** The Shiki options of every code block of the docs, the MDX ones and the item sources. */
export const codeHighlightOptions = {
  themes: { light: lightTheme, dark: 'github-dark' },
  defaultColor: false,
} as const;
