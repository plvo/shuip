import { notFound } from 'next/navigation';
import { BASES, isBase } from '@/lib/base-routes';
import { componentsSources, getLLMText } from '@/lib/source';

export const revalidate = false;

export const dynamicParams = false;

export async function GET(_req: Request, { params }: RouteContext<'/components/llms.mdx/[base]/[[...slug]]'>) {
  const { base, slug } = await params;
  if (!isBase(base)) notFound();
  const page = componentsSources[base].getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}

export async function generateStaticParams() {
  return BASES.flatMap((base) => componentsSources[base].generateParams().map((params) => ({ base, ...params })));
}
