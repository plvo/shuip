import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { notFound } from 'next/navigation';
import { BaseProviders } from '@/components/base-providers';
import { BASES, isBase } from '@/lib/base-routes';
import { baseOptions } from '@/lib/layout.shared';
import { sidebarTrees } from '@/lib/source';

export default async function Layout({ children, params }: LayoutProps<'/components/[base]'>) {
  const { base } = await params;
  if (!isBase(base)) notFound();

  const options = baseOptions(base);
  return (
    <BaseProviders base={base}>
      <DocsLayout {...options} nav={{ ...options.nav, mode: 'top' }} tree={sidebarTrees[base]}>
        {children}
      </DocsLayout>
    </BaseProviders>
  );
}

export const dynamicParams = false;

export function generateStaticParams() {
  return BASES.map((base) => ({ base }));
}
