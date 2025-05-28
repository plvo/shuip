import { type DocumentTypeNames, allDocuments } from 'contentlayer/generated';

const DocumentTypeHref: Record<DocumentTypeNames, string> = {
  Docs: 'docs',
  Component: 'components',
  Blocks: 'blocks',
};

interface GetDocumentProps {
  slug: string[];
  type: DocumentTypeNames;
}

/**
 * Get the document and slug from the params
 * @param params - The params from the page
 * @param type - The type of document
 * @returns The document and slug
 */
export async function getDocument({ slug, type }: GetDocumentProps) {
  const docName = slug ? slug.at(-1) : '';
  const docHref = `${DocumentTypeHref[type]}${docName ? `/${docName}` : ''}`;

  const document = allDocuments
    .filter((doc) => doc.type === type)
    .find((doc) => {
      return doc.slug === docHref;
    });

  return document;
}
