import type React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

export default function HoverItem({
  trigger,
  content,
}: {
  trigger: string | React.JSX.Element | React.ReactNode; // can be used as children
  content: string | React.JSX.Element;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger className="cursor-pointer">{trigger}</HoverCardTrigger>
      <HoverCardContent className="text-sm w-full">{content}</HoverCardContent>
    </HoverCard>
  );
}
