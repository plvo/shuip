/** biome-ignore-all lint/correctness/noUnreachable: ignore */
'use client';

import { LoaderCircle } from 'lucide-react';
import { QueryBoundary } from '@/components/ui/shuip/react-hook-form/query-boundary';

export default function QueryBoundaryExample() {
  const queryKeys = ['data', Math.random().toString(36).substring(2, 15)];
  return (
    <div className='flex flex-col items-center justify-center gap-4'>
      <QueryBoundary queryKeys={queryKeys} loadingFallback={<LoaderCircle className='animate-spin' />}>
        <DataComponent />
      </QueryBoundary>
    </div>
  );
}

function DataComponent() {
  // const res = await fetch('https://api.example.com/data');
  // const data = await res.json();
  // if (data.error) {
  // throw new Error('Error in DataComponent');
  // }

  return <div>DataComponent</div>;
}
