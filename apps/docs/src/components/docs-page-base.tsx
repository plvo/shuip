import { createRelativeLink } from 'fumadocs-ui/mdx';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ComponentProps } from 'react';
import { BaseSwitcher } from '@/components/base-switcher';
import { ItemHeader } from '@/components/item-content';
import { LLMCopyButton } from '@/components/llm-copy-button';
import { type Base, type BasedSection, DEFAULT_BASE, llmsUrl, withBase } from '@/lib/base-routes';
import { basedPageUrls, getPageImage, pageSource } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

export type DocsPageProps =
  | { section: 'docs'; slug?: string[] }
  | { section: BasedSection; base: Base; slug?: string[] };

const sourceOf = (props: DocsPageProps) =>
  props.section === 'docs' ? pageSource('docs') : pageSource(props.section, props.base);

export async function DocsPageBase(props: DocsPageProps) {
  const source = sourceOf(props);
  const page = source.getPage(props.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const base = props.section === 'docs' ? undefined : props.base;

  const markdownUrl =
    props.section === 'docs'
      ? `/docs/llms.mdx/${page.slugs.join('/')}`
      : llmsUrl(props.section, props.base, page.slugs);
  const RelativeLink = createRelativeLink(source, page);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} tableOfContent={{ style: 'clerk' }}>
      <div className='mb-4 space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-x-2 gap-y-3'>
          <DocsTitle className='font-mono text-4xl'>{page.data.title}</DocsTitle>
          <LLMCopyButton markdownUrl={markdownUrl} />
        </div>
        <DocsDescription className='mb-0'>{page.data.description}</DocsDescription>
        {props.section !== 'docs' && (
          <BaseSwitcher base={props.base} url={page.url} pages={basedPageUrls(props.section)} />
        )}
      </div>
      <DocsBody>
        {base && page.data.registryName && <ItemHeader base={base} registryName={page.data.registryName} />}
        <MDX
          components={getMDXComponents(
            {
              // this allows you to link to other pages with relative file paths
              a: (props: ComponentProps<'a'>) => (
                <RelativeLink {...props} href={base && props.href ? withBase(props.href, base) : props.href} />
              ),
            },
            base ?? DEFAULT_BASE,
          )}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateDocsPageMetadata(props: DocsPageProps): Promise<Metadata> {
  const page = sourceOf(props).getPage(props.slug);
  if (!page) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shuip.plvo.dev';
  const pageUrl = `${baseUrl}${page.url}`;
  const ogImage = getPageImage(page, props.section).url;

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
