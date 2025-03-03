import DocProvider from '@/lib/doc-provider';

export default async function Layout({ children }: { children: React.ReactNode }) {
  return <DocProvider>{children}</DocProvider>;
}
