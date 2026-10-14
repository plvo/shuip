import { createRelativeLink } from 'fumadocs-ui/mdx';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ComponentProps } from 'react';
import { BaseSwitcher } from '@/components/base-switcher';
import { ItemHeader } from '@/components/item-content';
import { LLMCopyButton } from '@/components/llm-copy-button';
import { type Base, type BasedSection, DEFAULT_BASE, llmsUrl, withBase } from '@/lib/base-routes';
import { getPageImage, pageSource } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

type Section = 'docs' | BasedSection;

export interface DocsPageProps {
  section: Section;
  /** The base of the route; pages of `/docs` have none. */
  base?: Base;
  slug?: string[];
}

export async function DocsPageBase({ section, base, slug }: DocsPageProps) {
  const source = pageSource(section, base);
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  const markdownUrl =
    section !== 'docs' && base ? llmsUrl(section, base, page.slugs) : `/${section}/llms.mdx/${page.slugs.join('/')}`;
  const RelativeLink = createRelativeLink(source, page);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} tableOfContent={{ style: 'clerk' }}>
      <div className='mb-4 space-y-4'>
        <div className='flex items-center gap-2 justify-between'>
          <DocsTitle className='font-mono text-4xl'>{page.data.title}</DocsTitle>
          <LLMCopyButton markdownUrl={markdownUrl} />
        </div>
        <DocsDescription className='mb-0'>{page.data.description}</DocsDescription>
        {base && <BaseSwitcher base={base} url={page.url} />}
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

export async function generateDocsPageMetadata({ section, base, slug }: DocsPageProps): Promise<Metadata> {
  const page = pageSource(section, base).getPage(slug);
  if (!page) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shuip.plvo.dev';
  const pageUrl = `${baseUrl}${page.url}`;
  const ogImage = getPageImage(page, section).url;

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
