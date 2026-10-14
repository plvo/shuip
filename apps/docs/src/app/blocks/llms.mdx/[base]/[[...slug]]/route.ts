import { notFound } from 'next/navigation';
import { BASES, isBase } from '@/lib/base-routes';
import { blocksSources, getLLMText } from '@/lib/source';

export const revalidate = false;

export const dynamicParams = false;

export async function GET(_req: Request, { params }: RouteContext<'/blocks/llms.mdx/[base]/[[...slug]]'>) {
  const { base, slug } = await params;
  if (!isBase(base)) notFound();
  const page = blocksSources[base].getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}

export async function generateStaticParams() {
  return BASES.flatMap((base) => blocksSources[base].generateParams().map((params) => ({ base, ...params })));
}
