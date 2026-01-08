import { createRelativeLink } from 'fumadocs-ui/mdx';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ItemHeader } from '@/components/item-content';
import { blocksSource, docsSource, getPageImage } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

type DocsPageType = 'docs' | 'blocks';

export async function DocsPageBase<T extends DocsPageType>({
  docsType,
  props,
}: {
  docsType: T;
  props: PageProps<`/${T}/[[...slug]]`>;
}) {
  const params = await props.params;
  const source = docsType === 'docs' ? docsSource : blocksSource;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} tableOfContent={{ style: 'clerk' }}>
      <div className='mb-4'>
        <DocsTitle className='font-mono text-4xl'>{page.data.title}</DocsTitle>
        <DocsDescription className='mb-0'>{page.data.description}</DocsDescription>
      </div>
      <DocsBody>
        {page.data.registryName && <ItemHeader registryName={page.data.registryName} />}
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateDocsPageMetadata<T extends DocsPageType>(
  docsType: T,
  props: PageProps<`/${T}/[[...slug]]`>,
): Promise<Metadata> {
  const params = await props.params;
  const source = docsType === 'docs' ? docsSource : blocksSource;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shuip.plvo.dev';
  const pageUrl = `${baseUrl}/${docsType}/${page.slugs.join('/')}`;
  const ogImage = getPageImage(page).url;

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      url: pageUrl,
      type: 'article',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: page.data.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description,
      images: [ogImage],
    },
  };
}
