'use client';

import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QueryBoundary } from '@/components/ui/shuip/react-hook-form/query-boundary';

export default function RhfQueryBoundaryErrorHandlingExample() {
  const [shouldError, setShouldError] = useState(false);
  const queryKeys = ['error-demo', 'user-profile'];

  return (
    <div className='space-y-4'>
      <div className='flex gap-2'>
        <Button variant='outline' onClick={() => setShouldError(false)}>
          Show Success
        </Button>
        <Button variant='destructive' onClick={() => setShouldError(true)}>
          Trigger Error
        </Button>
      </div>

      <QueryBoundary
        queryKeys={queryKeys}
        loadingFallback={
          <div className='flex items-center justify-center p-8'>
            <LoaderCircle className='animate-spin mr-2' />
            Loading user profile...
          </div>
        }
        errorFallback={({ error, resetErrorBoundary }) => (
          <div className='p-6 rounded-lg border border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center space-y-4 text-center'>
            <AlertTriangle className='text-destructive size-12' />
            <div>
              <h3 className='text-lg font-semibold mb-2'>Custom Error Handler</h3>
              <p className='text-muted-foreground'>{error.message}</p>
              <p className='text-xs text-muted-foreground mt-2'>Queries: {queryKeys.join(', ')}</p>
            </div>
            <Button onClick={resetErrorBoundary} variant='outline' className='gap-2'>
              Try Again
            </Button>
          </div>
        )}
      >
        <ErrorProneComponent shouldError={shouldError} />
      </QueryBoundary>
    </div>
  );
}

function ErrorProneComponent({ shouldError }: { shouldError: boolean }) {
  if (shouldError) {
    throw new Error('Something went wrong while loading the user profile!');
  }

  return (
    <div className='p-4 border rounded-lg bg-green-50'>
      <h3 className='font-semibold mb-2 text-green-800'>Success!</h3>
      <p className='text-green-700'>User profile loaded successfully.</p>
    </div>
  );
}
