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

// Variant folders built under `/r/`, each holding every item. Routing is separate: see `VARIANT_FOR_BASE`.
export const PUBLISHED_VARIANTS: readonly Variant[] = ['base', 'radix'];

// Maps each base to the variant folder that serves its styles. Base UI styles map to the `radix` folder,
// so no style reaches the `base` folder.
const VARIANT_FOR_BASE: VariantForBase = {
  base: 'radix',
  radix: 'radix',
};

export const routedVariants = (variantForBase: VariantForBase = VARIANT_FOR_BASE): Variant[] => [
  ...new Set(Object.values(variantForBase)),
];

const ruleMatcher = (rule: StyleRule): RegExp => new RegExp(`^(?:${rule.stylePatterns.join('|')})$`);

export const styleToBase = (style: string): Base | null =>
  STYLE_RULES.find((rule) => ruleMatcher(rule).test(style))?.base ?? null;

export interface StyleRewrite {
  source: string;
  destination: string;
}

export const styleRewrites = (variantForBase: VariantForBase = VARIANT_FOR_BASE): StyleRewrite[] =>
  routedVariants(variantForBase).map((variant) => ({
    source: `/r/:style(${STYLE_RULES.filter((rule) => variantForBase[rule.base] === variant)
      .flatMap((rule) => rule.stylePatterns)
      .join('|')})/:name.json`,
    destination: `/r/${variant}/:name.json`,
  }));
