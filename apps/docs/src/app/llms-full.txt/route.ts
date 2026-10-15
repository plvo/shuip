import { llmsFullText } from '@/lib/llms-text';
import { allPages, getLLMText } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const scan = allPages().map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(llmsFullText(scanned));
}
