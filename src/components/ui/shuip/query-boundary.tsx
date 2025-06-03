'use client';

import { Button } from '@/components/ui/button';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import * as React from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

interface QueryBoundaryProps {
  children: React.ReactNode;
  queryKeys?: string[];
  loadingFallback?: React.ReactNode;
  errorFallback?: (props: FallbackProps) => React.ReactNode;
}

export function QueryBoundary({
  children,
  queryKeys = [],
  loadingFallback = 'Loading...',
  errorFallback,
}: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={(props) =>
            errorFallback ? errorFallback(props) : <DefaultErrorFallback {...props} queryKeys={queryKeys} />
          }
        >
          <React.Suspense fallback={loadingFallback}>{children}</React.Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export function DefaultErrorFallback({
  error,
  resetErrorBoundary,
  queryKeys = [],
}: FallbackProps & { queryKeys?: string[] }) {
  return (
    <div className='p-6 rounded-lg border border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center space-y-4 text-center'>
      <AlertTriangle className='text-destructive size-12' />
      <div>
        <h3 className='text-lg font-semibold mb-2'>Oops, something went wrong!</h3>
        <p className='text-muted-foreground'>{error.message || 'Unexpected error'}</p>
        {queryKeys.length && (
          <p className='text-xs text-muted-foreground mt-2'>
            Concerned quer{queryKeys.length > 1 ? 'ies' : 'y'}: {queryKeys.join(', ')}
          </p>
        )}
      </div>
      <Button onClick={resetErrorBoundary} variant='outline' className='gap-2'>
        <RefreshCcw className='size-4' />
        Retry
      </Button>
    </div>
  );
}
