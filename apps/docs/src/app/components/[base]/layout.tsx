import { BasedSectionLayout } from '@/components/based-section-layout';
import { baseParams } from '@/lib/base-routes';

export default function Layout({ children, params }: LayoutProps<'/components/[base]'>) {
  return (
    <BasedSectionLayout section='components' params={params}>
      {children}
    </BasedSectionLayout>
  );
}

export const dynamicParams = false;

export const generateStaticParams = baseParams;
