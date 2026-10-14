'use client';

import { CheckIcon, Copy } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';

const DEFAULT_TIMEOUT = 2000;

export interface CopyButtonProps extends React.ComponentProps<typeof Button> {
  value: string;
  copiedIcon?: React.ReactNode;
  notCopiedIcon?: React.ReactNode;
}

export function CopyButton({ value, copiedIcon = <CheckIcon />, notCopiedIcon = <Copy />, ...props }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
    setTimeout(() => {
      setHasCopied(false);
    }, DEFAULT_TIMEOUT);
  };

  return (
    <Button size='icon' variant={'ghost'} className={'z-10 size-4'} onClick={handleCopy} {...props}>
      <span className='sr-only'>Copy</span>
      {hasCopied ? copiedIcon : notCopiedIcon}
    </Button>
  );
}
