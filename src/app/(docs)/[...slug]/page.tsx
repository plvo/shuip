import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { ItemHeader } from '@/components/mdx/item-content';
import { getTableOfContents } from '@/lib/toc';
import { processSlug } from '@/lib/utils';
import { mdxComponents } from '@/mdx-components';

export interface MdxFrontmatter {
  title: string;
  description: string;
  position?: string;
  registryName?: string;
}

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

  const { frontmatter } = await compileMDX<MdxFrontmatter>({
    source: fileContent,
    options: { parseFrontmatter: true },
  });

  return {
    title: frontmatter.title,
    description: frontmatter.description,
  };
}

export default async function Page({ params }: DocPageProps) {
  const { slug } = await params;

  const fileContent = getFileContent(slug);

  if (fileContent === null) {
    return notFound();
  }

  const { content, frontmatter } = await compileMDX<MdxFrontmatter>({
    source: fileContent,
    components: mdxComponents,
    options: { parseFrontmatter: true },
  });

  const toc = await getTableOfContents(fileContent);

  return (
    <section className='xl:grid xl:grid-cols-[1fr_300px]'>
      {content && (
        <article className='max-w-[880px]'>
          <div className='space-y-2 mb-6'>
            <h1 className='h1-mdx'>{frontmatter.title as string}</h1>
            <p className='text-base text-muted-foreground'>{frontmatter.description as string}</p>
          </div>
          {frontmatter.registryName && <ItemHeader registryName={frontmatter.registryName} />}
          {content}
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
