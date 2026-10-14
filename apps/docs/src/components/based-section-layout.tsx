import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { notFound } from 'next/navigation';
import type React from 'react';
import { BaseBadge } from '@/components/base-badge';
import { BaseCookie } from '@/components/base-cookie';
import { ProvidersForBase } from '@/components/providers/providers-for-base';
import { type BasedSection, isBase } from '@/lib/base-routes';
import { baseOptions } from '@/lib/layout.shared';
import { sidebarTreeOf } from '@/lib/source';

export interface BasedSectionLayoutProps {
  section: BasedSection;
  params: Promise<{ base: string }>;
  children: React.ReactNode;
}

/** The docs layout of a section under one base: its sidebar, nav links and primitive providers all follow that base. */
export async function BasedSectionLayout({ section, params, children }: BasedSectionLayoutProps) {
  const { base } = await params;
  if (!isBase(base)) notFound();

  const options = baseOptions(base);
  return (
    <ProvidersForBase base={base}>
      <BaseCookie base={base} />
      <DocsLayout
        {...options}
        nav={{ ...options.nav, mode: 'top' }}
        tree={sidebarTreeOf(section, base)}
        sidebar={{ banner: <BaseBadge base={base} /> }}
      >
        {children}
      </DocsLayout>
    </ProvidersForBase>
  );
}
