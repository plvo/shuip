import { notFound } from 'next/navigation';
import { type Base, isBase } from './base-routes';
import { type LlmsSourcePage, pageLlmsText } from './llms-text';
import { sectionParams } from './section-sources';

interface LlmsRouteContext {
  params: Promise<{ base: string; slug?: string[] }>;
}

interface SectionLoaders {
  getPage(slug?: string[]): LlmsSourcePage | undefined;
  generateParams(): { slug?: string[] }[];
}

/** The markdown of every page of a section under every base, for `/<section>/llms.mdx/<base>/<slug>`. */
export const llmsRoute = (loaders: Record<Base, SectionLoaders>) => ({
  GET: async (_request: Request, { params }: LlmsRouteContext) => {
    const { base, slug } = await params;
    if (!isBase(base)) notFound();
    const page = loaders[base].getPage(slug);
    if (!page) notFound();

    return new Response(await pageLlmsText(page), {
      headers: {
        'Content-Type': 'text/markdown',
      },
    });
  },
  generateStaticParams: () => sectionParams(loaders),
});
