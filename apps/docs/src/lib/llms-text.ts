import { resolveBaseOnly } from './base-only';
import { otherVariantsNote, parseBasedPath } from './base-routes';

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
