import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import type * as React from 'react';

export interface HoverRevealProps extends React.RefAttributes<HTMLDivElement> {
  children: string | React.JSX.Element;
  content: string | React.JSX.Element;
}

export function HoverReveal({ children, content, ...props }: HoverRevealProps) {
  return (
    <HoverCard {...props}>
      <HoverCardTrigger className='cursor-pointer'>{children}</HoverCardTrigger>
      <HoverCardContent className='text-sm w-full'>{content}</HoverCardContent>
    </HoverCard>
  );
}
