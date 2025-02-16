import { ReloadIcon } from '@radix-ui/react-icons';
import { Button, ButtonProps } from '@/components/ui/button';
import type { JSX, MouseEventHandler } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonSubmitProps {
  onClick: MouseEventHandler<HTMLButtonElement>;
  label: JSX.Element | string;
  disabled?: boolean;
  loading?: boolean;
}

export function ButtonSubmit({ onClick, label, disabled, loading, ...props }: ButtonSubmitProps & ButtonProps) {
  return (
    <Button
      type="submit"
      variant={'default'}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn('w-full', ...(props?.className ? [props.className] : []))}
      {...props}
    >
      {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}
