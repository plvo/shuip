import { BasedSectionLayout } from '@/components/based-section-layout';
import { baseParams } from '@/lib/base-routes';

export default function Layout({ children, params }: LayoutProps<'/blocks/[base]'>) {
  return (
    <BasedSectionLayout section='blocks' params={params}>
      {children}
    </BasedSectionLayout>
  );
}

export const dynamicParams = false;

export const generateStaticParams = baseParams;
