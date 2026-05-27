'use client';

import * as React from 'react';
import { Preview } from '@/components/item-preview';

export interface LazyPreviewProps {
  registryName: string;
  className?: string;
}

export function LazyPreview({ registryName, className }: LazyPreviewProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? <Preview registryName={registryName} /> : null}
    </div>
  );
}
