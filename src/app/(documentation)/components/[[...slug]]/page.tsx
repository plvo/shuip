import ItemSection from '@/components/documentation/item-section';
import ComponentSection from '@/components/documentation/item-section';
import { SidebarTableOfContents } from '@/components/documentation/toc';
import { MdxContent } from '@/components/shared/mdx';
import { getDocument } from '@/lib/content';
import { getItemFromSlug } from '@/lib/item';
import { generateDocumentationMetadata } from '@/lib/metadata';
import { getTableOfContents } from '@/lib/toc';

export async function generateMetadata({ params }: DocPageProps) {
  return generateDocumentationMetadata({ params, type: 'Component' });
}

export default async function Page({ params }: DocPageProps) {
  const { slug } = await params;
  const document = await getDocument({ slug, type: 'Component' });
  const toc = document ? await getTableOfContents(document.body.raw) : undefined;
  const { itemName, examples } = getItemFromSlug(slug);

  const hasExamples = examples ? examples.length > 1 : false;

  return (
    <>
      {document && !!itemName && (
        <article>
          <div className='space-y-2 mb-10'>
            <h1 className={'h1-mdx'}>{document.title}</h1>
            <p className='text-base text-muted-foreground'>{document.description}</p>
          </div>
          <MdxContent code={document.body.code} />
          <ItemSection componentName={itemName} examples={examples ?? []} />
        </article>
      )}

      <SidebarTableOfContents {...{ toc, isComponentPage: true, hasExamples }} />
    </>
  );
}
