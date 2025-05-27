import { type DocumentTypeNames, allDocuments } from 'contentlayer/generated';

const DocumentTypeHref: Record<DocumentTypeNames, string> = {
  Docs: 'docs',
  Component: 'components',
};

interface GetDocAndSlugFromParamsProps extends DocPageProps {
  type: DocumentTypeNames;
}

/**
 * Get the document and slug from the params
 * @param params - The params from the page
 * @param type - The type of document
 * @returns The document and slug
 */
export async function getDocAndSlugFromParams({ params, type }: GetDocAndSlugFromParamsProps) {
  const { slug } = await params;

  const docName = slug ? slug.at(-1) : '';
  const docHref = `${DocumentTypeHref[type]}${docName ? `/${docName}` : ''}`;

  const document = allDocuments
    .filter((doc) => doc.type === type)
    .find((doc) => {
      return doc.slug === docHref;
    });

  return { document, slugArray: slug || [] };
}
