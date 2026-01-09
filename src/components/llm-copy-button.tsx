'use client';

import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import { Check } from 'lucide-react';
import { Button } from './ui/button';

export interface LLMCopyButtonProps {
  markdownUrl: string;
}

export function LLMCopyButton({ markdownUrl }: LLMCopyButtonProps) {
  const [checked, onClick] = useCopyButton(async () => {
    try {
      const response = await fetch(markdownUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch markdown');
      }
      const text = await response.text();
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy markdown:', error);
    }
  });

  return (
    <Button
      size='sm'
      variant={'secondary'}
      data-checked={checked || undefined}
      aria-label={checked ? 'Markdown copied' : 'Copy Markdown'}
      onClick={onClick}
    >
      {checked && <Check className='size-4' />} Copy Markdown
    </Button>
  );
}
