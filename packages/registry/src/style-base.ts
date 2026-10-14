/** Primitive family a shadcn style belongs to. */
export type Base = 'base' | 'radix';

/** Folder of published items under `/r/`. */
export type Variant = 'base' | 'radix';

interface StyleRule {
  base: Base;
  /** Regex alternatives matching one `{style}` path segment. */
  stylePatterns: string[];
}

// Same classification as the shadcn CLI base detection: unprefixed legacy styles are Radix.
const STYLE_RULES: StyleRule[] = [
  { base: 'base', stylePatterns: ['base-[^/]+'] },
  { base: 'radix', stylePatterns: ['radix-[^/]+', 'new-york', 'new-york-v4', 'default'] },
];

// Variant folders built under `/r/`, each holding every item. A style is served from the folder named after its base.
export const PUBLISHED_VARIANTS: readonly Variant[] = ['base', 'radix'];

const ruleMatcher = (rule: StyleRule): RegExp => new RegExp(`^(?:${rule.stylePatterns.join('|')})$`);

export const styleToBase = (style: string): Base | null =>
  STYLE_RULES.find((rule) => ruleMatcher(rule).test(style))?.base ?? null;

export interface StyleRewrite {
  source: string;
  destination: string;
}

export const styleRewrites = (): StyleRewrite[] =>
  STYLE_RULES.map((rule) => ({
    source: `/r/:style(${rule.stylePatterns.join('|')})/:name.json`,
    destination: `/r/${rule.base}/:name.json`,
  }));
