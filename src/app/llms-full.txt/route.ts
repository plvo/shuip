import { combinedSource, getLLMText } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const scan = combinedSource.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}
