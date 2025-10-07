import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getTableOfContents } from '@/lib/toc';
import { parseFrontmatter, processSlug } from '@/lib/utils';
import { mdxComponents } from '@/mdx-components';

// export function generateStaticParams() {
//   const { allPaths } = getPathsByCategory();
//   return allPaths;
// }

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

  const { metadata } = parseFrontmatter(fileContent);

  return {
    title: metadata.title,
    description: metadata.summary,
  };
}

export default async function Page({ params }: DocPageProps) {
  const { slug } = await params;

  const fileContent = getFileContent(slug);

  if (fileContent === null) {
    return notFound();
  }

  const { metadata, mdxContent } = parseFrontmatter(fileContent);

  const toc = await getTableOfContents(fileContent);
  const isItemPage = slug[0] !== 'docs';

  const publishedAt = metadata.publishedAt
    ? new Date(metadata.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <section className='xl:grid xl:grid-cols-[1fr_300px]'>
      {mdxContent && (
        <article className='max-w-[880px]'>
          <div className='space-y-2 mb-6'>
            <h1 className='h1-mdx'>{metadata.title}</h1>
            <p className='text-base text-muted-foreground'>{metadata.summary}</p>
            {publishedAt && (
              <code className='whitespace-nowrap text-muted-foreground md:text-right'>{publishedAt}</code>
            )}
          </div>
          <MDXRemote source={mdxContent} components={mdxComponents} />
        </article>
      )}

      {/* <SidebarTableOfContents {...{ toc, isItemPage }} /> */}
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
