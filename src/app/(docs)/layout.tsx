import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { blocksSource } from '@/lib/source';

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: DocsLayoutProps) {
  return (
    <DocsLayout
      {...baseOptions()}
      tree={blocksSource.pageTree}
      nav={{
        enabled: true,
        component: <div className='bg-red-500 w-full h-full'>Hello</div>,
      }}
    >
      {children}
    </DocsLayout>
  );
}
