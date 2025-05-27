import { SidebarTableOfContents } from '@/components/documentation/toc';
import { MdxContent } from '@/components/shared/mdx';
import { getDocAndSlugFromParams } from '@/lib/content';
import { getTableOfContents } from '@/lib/toc';
import { filenameToTitle, firstCharUppercase } from '@/lib/utils';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { document, slugArray } = await getDocAndSlugFromParams({ params, type: 'Docs' });

  if (!document) {
    return {
      title: slugArray.length ? filenameToTitle(slugArray.at(-1) ?? 'Not Found') : 'Not Found',
    };
  }

  return {
    title: firstCharUppercase(document.title),
    description: document.description,
  };
}

export default async function Page({ params }: DocPageProps) {
  const { document } = await getDocAndSlugFromParams({ params, type: 'Docs' });
  const toc = document ? await getTableOfContents(document.body.raw) : undefined;

  return (
    <div className='xl:grid xl:grid-cols-[1fr_350px]'>
      {document && (
        <article>
          <div className='space-y-2 mb-10'>
            <h1 className={'h1-mdx'}>{document.title}</h1>
            <p className='text-base text-muted-foreground'>{document.description}</p>
          </div>
          <MdxContent code={document.body.code} />
        </article>
      )}

      <SidebarTableOfContents {...{ toc }} />
    </div>
  );
}
