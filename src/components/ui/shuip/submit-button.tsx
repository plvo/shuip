import { Button, type buttonVariants } from '@/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export interface SubmitButtonProps extends ButtonProps {
  children?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.JSX.Element;
}

export function SubmitButton({
  children,
  disabled,
  loading,
  icon = <ReloadIcon className='mr-2 size-4 animate-spin' />,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type='submit' variant={'default'} className={'w-full'} disabled={disabled || loading} {...props}>
      {loading && icon}
      {children}
    </Button>
  );
}
