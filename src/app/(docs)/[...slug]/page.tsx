import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { getPathsByCategory } from '@/actions/docs';
import { ItemHeader } from '@/components/mdx/item-content';
import { TableOfContents } from '@/components/toc';
import { getTableOfContents } from '@/lib/toc';
import { processSlug } from '@/lib/utils';
import { mdxComponents, useMDXComponents } from '@/mdx-components';
import type { MdxFrontmatter } from '@/types';

export async function generateStaticParams() {
  const pathsByCategory = await getPathsByCategory();

  return [
    { slug: ['/'] },
    ...Object.values(pathsByCategory)
      .flat()
      .map((pathObj) => {
        const pathParts = pathObj.path.split('/').filter(Boolean);
        return { slug: pathParts };
      }),
  ];
}

export interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata | undefined> {
  const { slug } = await params;

  if (slug === undefined) {
    return undefined;
  }

  const fileContent = getFileContent(slug);

  if (fileContent === null) {
    return notFound();
  }

  const { frontmatter } = await compileMDX<MdxFrontmatter>({
    source: fileContent,
    options: { parseFrontmatter: true },
  });

  return {
    title: frontmatter.title,
    description: frontmatter.description,
  };
}

export default async function DocsPage({ params }: DocPageProps) {
  const { slug } = await params;

  let fileContent = getFileContent(slug);

  const { h1: H1 } = useMDXComponents();

  if (fileContent === null) {
    return notFound();
  }

  let { content, frontmatter } = await compileMDX<MdxFrontmatter>({
    source: fileContent,
    components: mdxComponents,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        format: 'mdx',
      },
    },
  });

  if (frontmatter.urlToFetch) {
    fileContent = await fetch(frontmatter.urlToFetch).then((res) => res.text());
    if (fileContent === null) {
      return notFound();
    }
    ({ content, frontmatter } = await compileMDX<MdxFrontmatter>({
      source: fileContent,
      components: mdxComponents,
      options: { parseFrontmatter: true },
    }));
  }

  const toc = getTableOfContents(fileContent, !!frontmatter.registryName);

  return (
    <section className='xl:grid xl:grid-cols-[1fr_300px]'>
      {content && (
        <article className='max-w-[880px]'>
          <div className='space-y-2 mb-6'>
            <H1>{frontmatter.title as string}</H1>
            <p className='text-base text-muted-foreground'>{frontmatter.description as string}</p>
          </div>
          {frontmatter.registryName && <ItemHeader registryName={frontmatter.registryName} />}
          {content}
        </article>
      )}

      <aside className='hidden text-sm xl:block ml-8'>
        <div className='sticky top-20'>
          <div className='h-full overflow-auto'>
            <div className='space-y-2'>
              <p className='font-semibold text-muted-foreground'>On This Page</p>
              <TableOfContents items={toc} />
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}

function getFileContent(slug: string[]): string | null {
  const contentPath = getContentPath(slug);
  if (!fs.existsSync(contentPath)) {
    return null;
  }
  return fs.readFileSync(contentPath, 'utf-8');
}

function getContentPath(slug: string[]) {
  const [category, name] = processSlug(slug);
  return path.join(process.cwd(), 'content', `${category}`, `${name ?? 'index'}.mdx`);
}
