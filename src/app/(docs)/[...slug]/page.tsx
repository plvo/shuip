import { allDocuments } from 'contentlayer/generated';
import type { Metadata } from 'next';
import { SidebarTableOfContents } from '@/components/docs/toc';
import { MdxContent } from '@/components/mdx/mdx-content';
import { getDocument } from '@/lib/document';
import { getTableOfContents } from '@/lib/toc';
import { filenameToTitle, firstCharUppercase } from '@/lib/utils';

export interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  return allDocuments.map((doc) => ({ slug: [doc.slug] }));
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
  const isItemPage = documentType !== 'docs';

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
