import { SidebarTableOfContents } from '@/components/documentation/toc';
import { MdxContent } from '@/components/mdx/mdx-content';
import { getDocument } from '@/lib/document';
import { getTableOfContents } from '@/lib/toc';
import { filenameToTitle } from '@/lib/utils';
import { firstCharUppercase } from '@/lib/utils';
import type { Metadata } from 'next';

export interface DocPageProps {
  params: Promise<{ slug: string[] }>;
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
  const { document } = await getDocument(slug);
  const toc = document ? await getTableOfContents(document.body.raw) : undefined;

  return (
    <>
      {document && (
        <article>
          <div className='space-y-2 mb-6'>
            <h1 className={'h1-mdx'}>{document.title}</h1>
            <p className='text-base text-muted-foreground'>{document.description}</p>
          </div>
          <MdxContent code={document.body.code} />
        </article>
      )}

      <SidebarTableOfContents {...{ toc }} />
    </>
  );
}
