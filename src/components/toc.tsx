'use client';

import Link from 'next/link';
import React from 'react';
import { cn } from '@/lib/utils';

interface TocItem {
  title: string;
  url: string;
  depth: number;
  id: string;
}

interface Props {
  items: TocItem[];
  rootMargin?: string;
  threshold?: number | number[];
}

export function TableOfContents({ items, rootMargin = '0px 0px -90% 0px', threshold = 0.5 }: Props) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);

  const ids = React.useMemo(() => items.map((i) => i.id), [items]);

  React.useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);

    if (elements.length === 0) return;

    observerRef.current?.disconnect();

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
          return;
        }

        const above = ids
          .map((id) => document.getElementById(id))
          .filter((el): el is HTMLElement => !!el)
          .filter((el) => el.getBoundingClientRect().top < 100);

        if (above.length > 0) {
          setActiveId(above[above.length - 1].id);
        }
      },
      { root: null, rootMargin, threshold },
    );

    elements.forEach((el) => {
      io.observe(el);
    });
    observerRef.current = io;

    return () => io.disconnect();
  }, [ids, rootMargin, threshold]);

  return (
    <ul className='space-y-2'>
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <li key={item.id} style={{ paddingLeft: item.depth * 8 }}>
            <Link
              href={item.url}
              className={cn(isActive ? 'font-bold text-foreground ' : 'text-muted-foreground hover:text-foreground')}
              aria-current={isActive ? 'true' : undefined}
            >
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
