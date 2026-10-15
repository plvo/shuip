import { resolveBaseOnly } from './base-only';
import {
  BASED_SECTIONS,
  BASES,
  baseLabel,
  DEFAULT_BASE,
  llmsUrl,
  otherVariantsNote,
  parseBasedPath,
  sectionLabel,
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

const llmsFullIntro = (): string => {
  const pointers = BASES.filter((base) => base !== DEFAULT_BASE).flatMap((base) =>
    BASED_SECTIONS.map(
      (section) =>
        `- ${sectionLabel(section)}, ${baseLabel(base)}: ${sectionUrl(section, base, ['<name>'])} (markdown: ${llmsUrl(section, base, ['<name>'])})`,
    ),
  );

  return [
    `The component and block pages below are the ${baseLabel(DEFAULT_BASE)} variant, the default base. Each also exists for the other bases:`,
    ...pointers,
  ].join('\n');
};

/** The whole documentation for a model: the pages of the default base, introduced by where to find the other bases. */
export const llmsFullText = (pages: readonly string[]): string => [llmsFullIntro(), ...pages].join('\n\n');

export interface LlmsSourcePage {
  url: string;
  data: { title: string; getText(type: 'processed'): Promise<string> };
}

export async function getLLMText(page: LlmsSourcePage): Promise<string> {
  return llmsText({ title: page.data.title, url: page.url, processed: await page.data.getText('processed') });
}

/** What `llms-full.txt` serves for `pages`. */
export const llmsFullDocument = async (pages: readonly LlmsSourcePage[]): Promise<string> =>
  llmsFullText(await Promise.all(pages.map(getLLMText)));
