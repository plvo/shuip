import { notFound } from 'next/navigation';
import { ProvidersForBase } from '@/components/providers/providers-for-base';
import { baseParams, isBase } from '@/lib/base-routes';

export default async function Layout({ children, params }: LayoutProps<'/preview/[base]'>) {
  const { base } = await params;
  if (!isBase(base)) notFound();
  return <ProvidersForBase base={base}>{children}</ProvidersForBase>;
}

export const dynamicParams = false;

export const generateStaticParams = baseParams;
