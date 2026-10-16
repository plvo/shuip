import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { previewFor } from '@/components/preview/preview';
import { PreviewScreen } from '@/components/preview/preview-screen';
import { isBase } from '@/lib/base-routes';
import { previewPageOf, previewParams } from '@/lib/preview-pages';
import { exampleKeyOf, exampleTitle } from '@/lib/preview-routes';

type PreviewPageProps = PageProps<'/preview/[base]/[item]/[example]'>;

const targetOf = async (props: PreviewPageProps) => {
  const { base, item, example } = await props.params;
  if (!isBase(base)) notFound();
  const page = previewPageOf(base, item);
  if (!page) notFound();
  const registryName = exampleKeyOf(item, example);
  return { base, page, registryName, exampleTitle: exampleTitle(registryName) };
};

export default async function PreviewPage(props: PreviewPageProps) {
  const { base, page, registryName, exampleTitle } = await targetOf(props);
  const BasePreview = previewFor(base);

  return (
    <PreviewScreen registryName={registryName} title={page.title} exampleTitle={exampleTitle} docsUrl={page.url}>
      <BasePreview registryName={registryName} className='flex-1 p-4 sm:p-8' />
    </PreviewScreen>
  );
}

export const dynamicParams = false;

export const generateStaticParams = () => previewParams();

export async function generateMetadata(props: PreviewPageProps): Promise<Metadata> {
  const { page, exampleTitle } = await targetOf(props);
  return { title: `${page.title}, ${exampleTitle}`, robots: { index: false } };
}
