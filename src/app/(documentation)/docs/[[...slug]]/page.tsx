import { SidebarTableOfContents } from '@/components/documentation/toc';
import { MdxContent } from '@/components/shared/mdx';
import { getDocument } from '@/lib/content';
import { generateDocumentationMetadata } from '@/lib/metadata';
import { getTableOfContents } from '@/lib/toc';

export async function generateMetadata({ params }: DocPageProps) {
  return generateDocumentationMetadata({ params, type: 'Docs' });
}

export default async function Page({ params }: DocPageProps) {
  const { slug } = await params;
  const document = await getDocument({ slug, type: 'Docs' });
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
