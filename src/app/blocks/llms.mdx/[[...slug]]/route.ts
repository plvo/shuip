import { notFound } from 'next/navigation';
import { blocksSource, getLLMText } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/blocks/llms.mdx/[[...slug]]'>) {
  const { slug } = await params;
  const page = blocksSource.getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}

export async function generateStaticParams() {
  return blocksSource.generateParams();
}
