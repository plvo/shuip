import { allDocuments } from 'contentlayer/generated';
import { firstCharUppercase } from './utils';

// DocumentTypeNames[]
const DOCUMENT_TYPE_LIST = ['blocks', 'components', 'docs', 'lib'] as const;

export async function getDocument(slug: string[]) {
  const [documentType, item] = slug as [type: (typeof DOCUMENT_TYPE_LIST)[number], item: string | undefined];

  if (!DOCUMENT_TYPE_LIST.includes(documentType)) {
    return {
      documentType: null,
      item: null,
      document: null,
    };
  }

  const docSlug = `${documentType}${item ? `/${item}` : ''}`;

  const document = allDocuments
    .filter((doc) => doc.type === firstCharUppercase(documentType))
    .find((doc) => {
      return doc.slug === docSlug;
    });

  return {
    documentType,
    item,
    document,
  };
}
