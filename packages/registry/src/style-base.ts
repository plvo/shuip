/** Primitive family a shadcn style belongs to. */
export type Base = 'base' | 'radix';

/** Folder of published items under `/r/`. */
export type Variant = 'base' | 'radix';

export type VariantForBase = Record<Base, Variant>;

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

// Maps each base to the variant folder that serves it. Base UI styles are served the Radix variant
// until a dedicated Base UI variant is published.
const VARIANT_FOR_BASE: VariantForBase = {
  base: 'radix',
  radix: 'radix',
};

export const publishedVariants = (variantForBase: VariantForBase = VARIANT_FOR_BASE): Variant[] => [
  ...new Set(Object.values(variantForBase)),
];

export const PUBLISHED_VARIANTS: Variant[] = publishedVariants();

const ruleMatcher = (rule: StyleRule): RegExp => new RegExp(`^(?:${rule.stylePatterns.join('|')})$`);

export const styleToBase = (style: string): Base | null =>
  STYLE_RULES.find((rule) => ruleMatcher(rule).test(style))?.base ?? null;

export interface StyleRewrite {
  source: string;
  destination: string;
}

export const styleRewrites = (variantForBase: VariantForBase = VARIANT_FOR_BASE): StyleRewrite[] =>
  publishedVariants(variantForBase).map((variant) => ({
    source: `/r/:style(${STYLE_RULES.filter((rule) => variantForBase[rule.base] === variant)
      .flatMap((rule) => rule.stylePatterns)
      .join('|')})/:name.json`,
    destination: `/r/${variant}/:name.json`,
  }));
