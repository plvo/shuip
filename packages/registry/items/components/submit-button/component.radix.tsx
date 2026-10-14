import { Loader2Icon } from 'lucide-react';
import type * as React from 'react';
import { Button } from '@/components/ui/button';

export interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  icon?: React.JSX.Element;
}

export function SubmitButton({
  children,
  disabled,
  loading,
  icon = <Loader2Icon className='mr-2 size-4 animate-spin' aria-label='Loading' />,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type='submit' aria-label='Submit' disabled={disabled || loading} {...props}>
      {loading && icon}
      {children || 'Submit'}
    </Button>
  );
}
