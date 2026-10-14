import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { DEFAULT_BASE } from '@/lib/base-routes';
import { baseOptions } from '@/lib/layout.shared';
import { sidebarTreeOf } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const base = baseOptions();
  return (
    <DocsLayout {...base} nav={{ ...base.nav, mode: 'top' }} tree={sidebarTreeOf('components', DEFAULT_BASE)}>
      {children}
    </DocsLayout>
  );
}
