import { llmsFullDocument } from '@/lib/llms-text';
import { allPages } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  return new Response(await llmsFullDocument(allPages()));
}
