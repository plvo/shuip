import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { componentsSource } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/components'>) {
  const base = baseOptions();
  return (
    <DocsLayout {...base} nav={{ ...base.nav, mode: 'top' }} tree={componentsSource.pageTree}>
      {children}
    </DocsLayout>
  );
}
