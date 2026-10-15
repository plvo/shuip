import type { Root } from 'fumadocs-core/page-tree';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type React from 'react';
import type { Base } from '@/lib/base-routes';
import { baseOptions } from '@/lib/layout.shared';

export interface SiteDocsLayoutProps {
  /** The base of the pages inside; guides have none and link the sections through the redirect. */
  base?: Base;
  tree: Root;
  banner?: React.ReactNode;
  children: React.ReactNode;
}

/** The docs layout every section shares: the site nav on top and a sidebar with `tree`. */
export function SiteDocsLayout({ base, tree, banner, children }: SiteDocsLayoutProps) {
  const options = baseOptions(base);
  return (
    <DocsLayout
      {...options}
      nav={{ ...options.nav, mode: 'top' }}
      tree={tree}
      sidebar={banner ? { banner } : undefined}
    >
      {children}
    </DocsLayout>
  );
}
