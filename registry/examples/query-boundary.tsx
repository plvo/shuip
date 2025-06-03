'use client';

import { QueryBoundary } from '@/components/ui/shuip/query-boundary';
import { LoaderCircle } from 'lucide-react';

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

async function DataComponent() {
  const isError = Math.random() > 0.5;

  const getData = async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    if (isError) {
      throw new Error('Error in DataComponent');
    }
    return { data: 'DataComponent' };
  };

  const data = await getData();

  return (
    <div className='flex flex-col items-center justify-center gap-4'>
      DataComponent: <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
