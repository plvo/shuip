import type React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

export interface HoverItemProps {
  children: string | React.JSX.Element | React.ReactNode; // can be used as children
  content: string | React.JSX.Element;
}

export default function HoverItem({ children, content }: HoverItemProps) {
  return (
    <HoverCard>
      <HoverCardTrigger className="cursor-pointer">{children}</HoverCardTrigger>
      <HoverCardContent className="text-sm w-full">{content}</HoverCardContent>
    </HoverCard>
  );
}
