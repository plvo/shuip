import { resolveBaseOnly } from './base-only';
import {
  BASES,
  type BasedSection,
  baseLabel,
  DEFAULT_BASE,
  llmsUrl,
  otherVariantsNote,
  parseBasedPath,
  sectionUrl,
} from './base-routes';

export interface LlmsPage {
  title: string;
  url: string;
  /** The processed markdown of the page, which still holds the blocks written for each base. */
  processed: string;
}

/** The markdown of a page for a reader outside the browser: the blocks of the page's base and a pointer to its other variants. */
export const llmsText = ({ title, url, processed }: LlmsPage): string => {
  const base = parseBasedPath(url)?.base;
  const note = otherVariantsNote(url);

  return `# ${title} (${url})
${note ? `\n${note}\n` : ''}
${base ? resolveBaseOnly(processed, base) : processed}`;
};

const BASED_SECTIONS: readonly { section: BasedSection; label: string }[] = [
  { section: 'components', label: 'Components' },
  { section: 'blocks', label: 'Blocks' },
];

const llmsFullIntro = (): string => {
  const pointers = BASES.filter((base) => base !== DEFAULT_BASE).flatMap((base) =>
    BASED_SECTIONS.map(
      ({ section, label }) =>
        `- ${label}, ${baseLabel(base)}: ${sectionUrl(section, base, ['<name>'])} (markdown: ${llmsUrl(section, base, ['<name>'])})`,
    ),
  );

  return [
    `These pages are the ${baseLabel(DEFAULT_BASE)} variant, the default base. Every component and block page also exists for the other bases:`,
    ...pointers,
  ].join('\n');
};

/** The whole documentation for a model: the pages of the default base, introduced by where to find the other bases. */
export const llmsFullText = (pages: readonly string[]): string => [llmsFullIntro(), ...pages].join('\n\n');
