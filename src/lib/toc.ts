import { titleToFilename } from './utils';

interface TocItem {
  title: string;
  url: string;
  depth: number;
  id: string;
}

export function getTableOfContents(mdxContent: string, isItemContent: boolean = false): TocItem[] {
  const toc: TocItem[] = [];

  const lines = mdxContent.split('\n');

  const headingRegex = /^(#{1,6})\s+(.*)$/;

  for (const line of lines) {
    const match = line.match(headingRegex);
    if (match) {
      const hashes = match[1];
      const title = match[2].trim();
      const id = titleToFilename(title);

      toc.push({
        title,
        url: `#${id}`,
        depth: hashes.length,
        id,
      });
    }
  }

  if (isItemContent) {
    toc.unshift({
      title: 'Preview',
      url: '#preview',
      depth: 2,
      id: 'preview',
    });
    toc.push(
      {
        title: 'Examples',
        url: '#examples',
        depth: 2,
        id: 'examples',
      },
      {
        title: 'Props',
        url: '#props',
        depth: 2,
        id: 'props',
      },
    );
  }
  return toc;
}
