// @ts-nocheck
// TODO: Fix this file and improve Tree Component (names)

'use client';

import * as React from 'react';
import { TableOfContents } from '@/lib/toc';
import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/use-mounted';

interface TocProps {
  toc?: TableOfContents;
  isComponentPage?: boolean;
  hasExamples?: boolean;
}

export function SidebarTableOfContents({ toc, isComponentPage, hasExamples }: TocProps) {
  const itemIds = React.useMemo(() => {
    if (!toc?.items) return [];
    return toc.items
      .flatMap((item) => [item.url, item?.items?.map((subItem) => subItem.url)])
      .flat()
      .filter(Boolean)
      .map((id) => id?.split('#')[1]);
  }, [toc]);

  const activeHeading = useActiveItem(itemIds);
  const mounted = useMounted();

  const docToc: TableOfContents | undefined = isComponentPage
    ? {
        items: [
          {
            title: 'Installation',
            url: '#installation',
          },
          {
            title: 'Usage',
            url: '#usage',
          },
          {
            ...(hasExamples && {
              title: 'Examples',
              url: '#examples',
            }),
          },
        ],
      }
    : toc;

  if (!docToc?.items?.length) {
    return null;
  }

  return (
    <div className="hidden text-sm xl:block border-l p-8 ml-8">
      <div className="sticky top-20 -mt-6">
        <div className="h-full overflow-auto">
          <div className="space-y-2">
            <p className="font-bold text-lg">On This Page</p>
            {docToc && <TreeToc tree={docToc} activeItem={activeHeading} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function useActiveItem(itemIds: string[]) {
  const [activeId, setActiveId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: `0% 0% -80% 0%` },
    );

    itemIds?.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      itemIds?.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [itemIds]);

  return activeId ?? undefined;
}

interface TreeTocProps {
  tree: TableOfContents;
  level?: number;
  activeItem?: string;
}

function TreeToc({ tree, level = 1, activeItem }: TreeTocProps) {
  return tree?.items?.length && level < 3 ? (
    <ul className={cn('m-0 list-none', { 'pl-4': level !== 1 })}>
      {tree.items.map((item, index) => {
        return (
          <li key={index} className={cn('mt-0 pt-2')}>
            <a
              href={item.url}
              className={cn(
                'inline-block no-underline transition-colors hover:text-foreground',
                item.url === `#${activeItem}` ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {item.title}
            </a>
            {item.items?.length ? <TreeToc tree={item} level={level + 1} activeItem={activeItem} /> : null}
          </li>
        );
      })}
    </ul>
  ) : null;
}
