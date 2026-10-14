import { type Base, PUBLISHED_VARIANTS } from '@repo/registry/style-base';

export type { Base };

/** Sections of the docs that exist once per base. Guides under `/docs` do not. */
export type BasedSection = 'components' | 'blocks';

const BASED_SECTIONS: readonly BasedSection[] = ['components', 'blocks'];

export const BASES: readonly Base[] = PUBLISHED_VARIANTS;

export const DEFAULT_BASE: Base = 'base';

const BASE_LABELS: Record<Base, string> = { base: 'Base UI', radix: 'Radix' };

const LLMS_SEGMENT = 'llms.mdx';

export const isBase = (value: string): value is Base => (BASES as readonly string[]).includes(value);

export const baseLabel = (base: Base): string => BASE_LABELS[base];

const isBasedSection = (value: string | undefined): value is BasedSection =>
  (BASED_SECTIONS as readonly (string | undefined)[]).includes(value);

export const sectionUrl = (section: BasedSection, base: Base, slugs: readonly string[] = []): string =>
  ['', section, base, ...slugs].join('/');

export const llmsUrl = (section: BasedSection, base: Base, slugs: readonly string[] = []): string =>
  ['', section, LLMS_SEGMENT, base, ...slugs].join('/');

export interface BasedPath {
  section: BasedSection;
  base: Base;
  slugs: string[];
}

export const parseBasedPath = (pathname: string): BasedPath | null => {
  const [, section, base, ...slugs] = pathname.split('/');
  if (!isBasedSection(section) || base === undefined || !isBase(base)) return null;
  return { section, base, slugs };
};

/** The same page in another base, or null when the pathname is not a page that exists per base. */
export const siblingUrl = (pathname: string, base: Base): string | null => {
  const parsed = parseBasedPath(pathname);
  return parsed && sectionUrl(parsed.section, base, parsed.slugs);
};

/** Tells a reader of the markdown of a page, human or model, which base it is for and where the others are. */
export const otherVariantsNote = (pathname: string): string | null => {
  const parsed = parseBasedPath(pathname);
  if (!parsed) return null;
  const others = BASES.filter((base) => base !== parsed.base).map(
    (base) => `${baseLabel(base)} variant: ${sectionUrl(parsed.section, base, parsed.slugs)}`,
  );
  return [`This is the ${baseLabel(parsed.base)} variant.`, ...others].join(' ');
};

const SECTION_LINK = /^\/(components|blocks)(\/[^?#]*)?([?#].*)?$/;

/** Keeps a link written for a section inside the base the reader is on; other links are returned as they are. */
export const withBase = (href: string, base: Base): string => {
  const match = SECTION_LINK.exec(href);
  if (!match) return href;
  const [, section, path = '', suffix = ''] = match;
  const firstSegment = path.split('/')[1];
  if (firstSegment && (isBase(firstSegment) || firstSegment === LLMS_SEGMENT)) return href;
  return `/${section}/${base}${path}${suffix}`;
};

export interface BaseRedirect {
  source: string;
  destination: string;
  permanent: true;
}

const LLMS_SEGMENT_PATTERN = 'llms\\.mdx';

const notYetBased = (extra: string[] = []): string => `(?!(?:${[...BASES, ...extra].join('|')})(?:/|$))`;

/** Sends every address that predates the base segment to the page of the default base. */
export const baseRedirects = (): BaseRedirect[] =>
  BASED_SECTIONS.flatMap((section) => {
    const target = `/${section}/${DEFAULT_BASE}`;
    const markdown = `/${section}/${LLMS_SEGMENT}`;
    return [
      { source: `/${section}`, destination: target },
      { source: `/${section}/:path(${notYetBased([LLMS_SEGMENT_PATTERN])}.+)`, destination: `${target}/:path` },
      { source: markdown, destination: `${markdown}/${DEFAULT_BASE}` },
      { source: `${markdown}/:path(${notYetBased()}.+)`, destination: `${markdown}/${DEFAULT_BASE}/:path` },
    ].map((redirect) => ({ ...redirect, permanent: true as const }));
  });
