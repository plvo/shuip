import { type Base, styleToBase } from '@repo/registry/style-base';

export const PROJECT_NAME = 'app';

export interface ScaffoldStyle {
  style: string;
  base: Base;
  preset: string;
}

// Only `<base>-<preset>` styles can be scaffolded; legacy styles (`new-york-v4`, `default`) have no preset.
export const parseScaffoldStyle = (style: string): ScaffoldStyle | null => {
  const base = styleToBase(style);
  return base && style.startsWith(`${base}-`) ? { style, base, preset: style.slice(base.length + 1) } : null;
};

export const initArgs = ({ base, preset }: ScaffoldStyle): string[] => [
  'init',
  '-t',
  'next',
  '-b',
  base,
  '-p',
  preset,
  '-n',
  PROJECT_NAME,
  '--no-monorepo',
  '-y',
];
