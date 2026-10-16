'use client';

import { QueryClient, QueryClientProvider, useSuspenseQuery } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { QueryBoundary } from '@/components/ui/shuip/tanstack-query/query-boundary';

const PROFILE_QUERY_KEYS = ['profile', 'ada'];

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function fetchProfile(shouldFail: boolean) {
  await wait(800);
  if (shouldFail) throw new Error('The profile request failed.');
  return { name: 'Ada Lovelace', email: 'ada@example.com' };
}

export default function QueryBoundaryErrorHandlingExample() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  const [requested, setRequested] = useState(false);
  const [shouldFail, setShouldFail] = useState(true);

  const toggleRequest = () => {
    if (requested) queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEYS });
    setRequested(!requested);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className='flex w-full max-w-sm flex-col items-center gap-6'>
        <div className='flex w-full items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <Checkbox
              id='fail-next-request'
              checked={shouldFail}
              onCheckedChange={(checked) => setShouldFail(checked === true)}
            />
            <Label htmlFor='fail-next-request'>Fail the next request</Label>
          </div>
          <Button variant={requested ? 'outline' : 'default'} onClick={toggleRequest}>
            {requested ? 'Reset' : 'Load profile'}
          </Button>
        </div>
        <div className='flex min-h-24 w-full items-center justify-center'>
          {requested ? (
            <QueryBoundary
              queryKeys={PROFILE_QUERY_KEYS}
              loadingFallback={
                <div role='status' className='flex items-center gap-2 text-muted-foreground'>
                  <LoaderCircle className='size-4 animate-spin' />
                  Loading profile...
                </div>
              }
            >
              <Profile shouldFail={shouldFail} />
            </QueryBoundary>
          ) : (
            <p className='text-sm text-muted-foreground'>Nothing requested yet.</p>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}

function Profile({ shouldFail }: { shouldFail: boolean }) {
  const { data } = useSuspenseQuery({
    queryKey: PROFILE_QUERY_KEYS,
    queryFn: () => fetchProfile(shouldFail),
  });

  return (
    <div className='w-full rounded-lg border bg-muted/50 p-4'>
      <p className='font-semibold'>{data.name}</p>
      <p className='text-sm text-muted-foreground'>{data.email}</p>
    </div>
  );
}
