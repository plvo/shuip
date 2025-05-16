import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReloadIcon } from '@radix-ui/react-icons';
import type { JSX, MouseEventHandler } from 'react';

export interface ButtonSubmitProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  label: JSX.Element | string;
  disabled?: boolean;
  loading?: boolean;
}

export default function ButtonSubmit({
  onClick,
  label,
  disabled,
  loading,
  ...props
}: ButtonSubmitProps & React.ComponentProps<'button'>) {
  return (
    <Button
      type='submit'
      variant={'default'}
      {...(onClick && { onClick })}
      disabled={disabled || loading}
      className={cn('w-full', ...(props?.className ? [props.className] : []))}
      {...props}
    >
      {loading && <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />}
      {label}
    </Button>
  );
}
