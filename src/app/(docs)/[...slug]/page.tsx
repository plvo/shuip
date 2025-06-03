import { SidebarTableOfContents } from '@/components/docs/toc';
import { MdxContent } from '@/components/mdx/mdx-content';
import { getDocument } from '@/lib/document';
import { getTableOfContents } from '@/lib/toc';
import { filenameToTitle } from '@/lib/utils';
import { firstCharUppercase } from '@/lib/utils';
import type { Metadata } from 'next';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), 'content');
  const allRoutes: { slug: string[] }[] = [];

  async function scanDirectory(dir: string, basePath: string[] = []): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const newBasePath = [...basePath, entry.name];
          await scanDirectory(path.join(dir, entry.name), newBasePath);
        } else if (entry.name.endsWith('.mdx')) {
          const fileName = entry.name.replace(/\.mdx$/, '');
          const slug = [...basePath, fileName];
          allRoutes.push({ slug });
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  }

  await scanDirectory(contentDir);

  return allRoutes;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { item, document } = await getDocument(slug);

  if (!document) {
    return {
      title: item ? filenameToTitle(item) : 'Not Found',
    };
  }

  return {
    title: firstCharUppercase(document.title),
    description: document.description,
  };
}

export default async function Page({ params }: DocPageProps) {
  const { slug } = await params;
  const { document, documentType } = await getDocument(slug);
  const toc = document ? await getTableOfContents(document.body.raw) : undefined;
  const isItemPage = documentType === 'components' || documentType === 'blocks' || documentType === 'lib';

  return (
    <section className='xl:grid xl:grid-cols-[1fr_300px]'>
      {document && (
        <article className='max-w-[880px]'>
          <div className='space-y-2 mb-6'>
            <h1 className={'h1-mdx'}>{document.title}</h1>
            <p className='text-base text-muted-foreground'>{document.description}</p>
          </div>
          <MdxContent code={document.body.code} />
        </article>
      )}

      <SidebarTableOfContents {...{ toc, isItemPage }} />
    </section>
  );
}
