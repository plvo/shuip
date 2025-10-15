'use client';

import { LoaderCircle } from 'lucide-react';
import { QueryBoundary } from '@/components/ui/shuip/react-hook-form/query-boundary';

export default function RhfQueryBoundaryExample() {
  const queryKeys = ['user-data', Math.random().toString(36).substring(2, 15)];

  return (
    <div className='flex flex-col items-center justify-center gap-4'>
      <QueryBoundary queryKeys={queryKeys} loadingFallback={<LoaderCircle className='animate-spin' />}>
        <DataComponent />
      </QueryBoundary>
    </div>
  );
}

function DataComponent() {
  // Simulate data fetching that might fail
  // const res = await fetch('https://api.example.com/user');
  // const data = await res.json();
  // if (data.error) {
  //   throw new Error('Failed to load user data');
  // }

  return (
    <div className='p-4 border rounded-lg'>
      <h3 className='font-semibold mb-2'>User Data</h3>
      <p className='text-muted-foreground'>This component is wrapped in a QueryBoundary for error handling.</p>
    </div>
  );
}
