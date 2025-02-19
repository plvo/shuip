'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon, ClipboardIcon } from 'lucide-react';

export async function copyToClipboardWithMeta(value: string) {
  navigator.clipboard.writeText(value);
}

export default function ButtonCopy({ value }: { value: string }) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  return (
    <Button
      size="icon"
      variant={'ghost'}
      className={'relative z-10 h-6 w-6 text-zinc-50 hover:bg-zinc-700 hover:text-zinc-50 [&_svg]:h-3 [&_svg]:w-3'}
      onClick={() => {
        copyToClipboardWithMeta(value);
        setHasCopied(true);
      }}
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? <CheckIcon /> : <ClipboardIcon />}
    </Button>
  );
}
