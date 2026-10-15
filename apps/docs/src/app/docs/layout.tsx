import { SiteDocsLayout } from '@/components/site-docs-layout';
import { docsSidebarTree } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return <SiteDocsLayout tree={docsSidebarTree()}>{children}</SiteDocsLayout>;
}
