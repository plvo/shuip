import { bundledThemes, type ThemeRegistration } from 'shiki';

/** The github-light colours under 4.5:1 on the code block backgrounds, each with the same hue, darker. */
const LIGHT_READABLE_COLORS: Record<string, string> = {
  '#6a737d': '#606871',
  '#22863a': '#1e7734',
  '#d73a49': '#c52837',
  '#e36209': '#ac4a07',
  '#fafbfc': '#506a85',
  '#f6f8fa': '#4c6a89',
};

/** The github-dark colours under 4.5:1 on the code block backgrounds, each with the same hue, lighter. */
const DARK_READABLE_COLORS: Record<string, string> = {
  '#6a737d': '#828b95',
  '#24292e': '#7d8b99',
  '#2f363d': '#7c8b9a',
};

const readableTheme = async (
  source: 'github-light' | 'github-dark',
  name: string,
  readableColors: Record<string, string>,
): Promise<ThemeRegistration> => {
  const { default: theme } = await bundledThemes[source]();
  return {
    ...theme,
    name,
    tokenColors: theme.tokenColors?.map(({ settings, ...rule }) => ({
      ...rule,
      settings: {
        ...settings,
        foreground: settings?.foreground && (readableColors[settings.foreground.toLowerCase()] ?? settings.foreground),
      },
    })),
  };
};

/** The Shiki options of every code block of the docs, the MDX ones and the item sources. */
export const codeHighlightOptions = {
  themes: {
    light: await readableTheme('github-light', 'shuip-light', LIGHT_READABLE_COLORS),
    dark: await readableTheme('github-dark', 'shuip-dark', DARK_READABLE_COLORS),
  },
  defaultColor: false,
} as const;
