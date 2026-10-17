import { GET as ogImage, generateStaticParams as ogParams } from '@/lib/og-image-route';
import { docsSource } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  return ogImage(docsSource, slug);
}

export function generateStaticParams() {
  return ogParams(docsSource, 'docs');
}
