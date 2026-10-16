'use client';

import { QueryClient, QueryClientProvider, useSuspenseQuery } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QueryBoundary } from '@/components/ui/shuip/tanstack-query/query-boundary';

const PROFILE_QUERY_KEY = ['profile'];

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function fetchProfile() {
  await wait(800);
  return { name: 'Ada Lovelace', email: 'ada@example.com' };
}

export default function QueryBoundaryExample() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  const [requested, setRequested] = useState(false);

  const toggleRequest = () => {
    if (requested) queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY });
    setRequested(!requested);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className='flex w-full max-w-sm flex-col items-center gap-6'>
        <Button variant={requested ? 'outline' : 'default'} onClick={toggleRequest}>
          {requested ? 'Reset' : 'Load profile'}
        </Button>
        <div className='flex min-h-24 w-full items-center justify-center'>
          {requested ? (
            <QueryBoundary
              queryKeys={PROFILE_QUERY_KEY}
              loadingFallback={
                <div role='status' className='flex items-center gap-2 text-muted-foreground'>
                  <LoaderCircle className='size-4 animate-spin' />
                  Loading profile...
                </div>
              }
            >
              <Profile />
            </QueryBoundary>
          ) : (
            <p className='text-sm text-muted-foreground'>Nothing requested yet.</p>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}

function Profile() {
  const { data } = useSuspenseQuery({ queryKey: PROFILE_QUERY_KEY, queryFn: fetchProfile });

  return (
    <div className='w-full rounded-lg border bg-muted/50 p-4'>
      <h3 className='font-semibold'>{data.name}</h3>
      <p className='text-sm text-muted-foreground'>{data.email}</p>
    </div>
  );
}
