import { DEFAULT_BASE } from '@/lib/base-routes';
import { GET as ogImage, generateStaticParams as ogParams } from '@/lib/og-image-route';
import { blocksSources } from '@/lib/source';

// Both bases share one image: the title and the description do not depend on the base.
const blocksSource = blocksSources[DEFAULT_BASE];

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/blocks/[...slug]'>) {
  const { slug } = await params;
  return ogImage(blocksSource, slug);
}

export function generateStaticParams() {
  return ogParams(blocksSource, 'blocks');
}
