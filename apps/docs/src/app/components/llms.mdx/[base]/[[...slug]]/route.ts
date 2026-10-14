import { notFound } from 'next/navigation';
import { componentsSource, getLLMText } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/components/llms.mdx/[[...slug]]'>) {
  const { slug } = await params;
  const page = componentsSource.getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}

export async function generateStaticParams() {
  return componentsSource.generateParams();
}
