export type Base = 'base' | 'radix';

interface StyleRule {
  base: Base;
  /** Alternatives for a single `:style(...)` path segment. */
  styles: string[];
}

// Mirrors the shadcn CLI base detection: unprefixed legacy styles are Radix.
const STYLE_RULES: StyleRule[] = [
  { base: 'base', styles: ['base-[^/]+'] },
  { base: 'radix', styles: ['radix-[^/]+', 'new-york', 'new-york-v4', 'default'] },
];

// Variant set served to each base. Point `base` at 'base' once its variant is published.
const VARIANT_FOR_BASE: Record<Base, Base> = {
  base: 'radix',
  radix: 'radix',
};

export const PUBLISHED_VARIANTS: Base[] = [...new Set(Object.values(VARIANT_FOR_BASE))];

const ruleMatcher = (rule: StyleRule): RegExp => new RegExp(`^(?:${rule.styles.join('|')})$`);

export const styleToBase = (style: string): Base | null =>
  STYLE_RULES.find((rule) => ruleMatcher(rule).test(style))?.base ?? null;

export const styleToVariant = (style: string): Base | null => {
  const base = styleToBase(style);
  return base && VARIANT_FOR_BASE[base];
};

export interface StyleRewrite {
  source: string;
  destination: string;
}

export const styleRewrites = (): StyleRewrite[] =>
  PUBLISHED_VARIANTS.map((variant) => ({
    source: `/r/:style(${STYLE_RULES.filter((rule) => VARIANT_FOR_BASE[rule.base] === variant)
      .flatMap((rule) => rule.styles)
      .join('|')})/:name.json`,
    destination: `/r/${variant}/:name.json`,
  }));
