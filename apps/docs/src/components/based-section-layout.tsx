import { notFound } from 'next/navigation';
import type React from 'react';
import { BaseBadge } from '@/components/base-badge';
import { BaseCookie } from '@/components/base-cookie';
import { ProvidersForBase } from '@/components/providers/providers-for-base';
import { SiteDocsLayout } from '@/components/site-docs-layout';
import { type BasedSection, isBase } from '@/lib/base-routes';
import { sidebarTreeFor } from '@/lib/section-sources';
import { sidebarSources } from '@/lib/source';

export interface BasedSectionLayoutProps {
  section: BasedSection;
  params: Promise<{ base: string }>;
  children: React.ReactNode;
}

/** The docs layout of a section under one base: its sidebar, nav links and primitive providers all follow that base. */
export async function BasedSectionLayout({ section, params, children }: BasedSectionLayoutProps) {
  const { base } = await params;
  if (!isBase(base)) notFound();

  return (
    <ProvidersForBase base={base}>
      <BaseCookie base={base} />
      <SiteDocsLayout
        base={base}
        tree={sidebarTreeFor(section, base, sidebarSources)}
        banner={<BaseBadge base={base} />}
      >
        {children}
      </SiteDocsLayout>
    </ProvidersForBase>
  );
}
