import { notFound } from 'next/navigation';
import { docsSource, getLLMText } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/docs/llms.mdx/[[...slug]]'>) {
  const { slug } = await params;
  const page = docsSource.getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}

export async function generateStaticParams() {
  return docsSource.generateParams();
}
