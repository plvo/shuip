'use client';

import { type Blocks, type Docs, allDocuments } from 'contentlayer/generated';

interface UseDocumentsReturn {
  documents: Docs[];
  allComponentGroups: string[];
  blocks: Blocks[];
}

export function useDocuments(): UseDocumentsReturn {
  const documents = allDocuments.filter((doc) => doc.type === 'Docs').sort((a, b) => a.position - b.position);

  const allComponentGroups: string[] = [
    ...new Set(
      allDocuments
        .filter((doc) => doc.type === 'Components')
        .map((doc) => doc.group)
        .filter((group) => group !== undefined)
        .sort((a, b) => a.localeCompare(b)),
    ),
  ];

  const blocks = allDocuments.filter((doc) => doc.type === 'Blocks').sort((a, b) => a.title.localeCompare(b.title));

  return { documents, allComponentGroups, blocks };
}
