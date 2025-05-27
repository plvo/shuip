import { firstCharUppercase } from './utils';

import type { DocumentTypeNames } from 'contentlayer/generated';
import type { Metadata } from 'next';
import { getDocument } from './content';
import { filenameToTitle } from './utils';

export async function generateDocumentationMetadata({
  params,
  type,
}: DocPageProps & { type: DocumentTypeNames }): Promise<Metadata> {
  const { slug } = await params;
  const document = await getDocument({ slug, type });

  if (!document) {
    return {
      title: slug.length ? filenameToTitle(slug.at(-1) ?? 'Not Found') : 'Not Found',
    };
  }

  return {
    title: firstCharUppercase(document.title),
    description: document.description,
  };
}
