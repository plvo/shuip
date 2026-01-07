import { blocksSource, componentsSource, docsSource, getLLMText } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const scan = [...docsSource.getPages(), ...componentsSource.getPages(), ...blocksSource.getPages()].map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}
