'use client';

import { allDocs } from 'contentlayer/generated';
import { usePathname } from 'next/navigation';

export function DocsNav() {
  const pathname = usePathname();
  const docPages = allDocs;

  return docPages.length ? (
    <div className='flex flex-col gap-1'>
      {docPages.map((item, index) => (
        <h4 key={index} className='rounded-md px-2 py-1 text-sm font-medium'>
          {item.title}
        </h4>
      ))}
    </div>
  ) : null;
}
