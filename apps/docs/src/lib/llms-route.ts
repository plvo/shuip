import { notFound } from 'next/navigation';
import { type BasedSection, isBase } from './base-routes';
import { getLLMText, pageSource, paramsOfSection } from './source';

interface LlmsRouteContext {
  params: Promise<{ base: string; slug?: string[] }>;
}

/** The markdown of every page of a section under every base, for `/<section>/llms.mdx/<base>/<slug>`. */
export const llmsRoute = (section: BasedSection) => ({
  GET: async (_request: Request, { params }: LlmsRouteContext) => {
    const { base, slug } = await params;
    if (!isBase(base)) notFound();
    const page = pageSource(section, base).getPage(slug);
    if (!page) notFound();

    return new Response(await getLLMText(page), {
      headers: {
        'Content-Type': 'text/markdown',
      },
    });
  },
  generateStaticParams: () => paramsOfSection(section),
});
