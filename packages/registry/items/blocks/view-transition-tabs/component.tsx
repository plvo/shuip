/// <reference types="react/experimental" />
'use client';

import { usePathname, useRouter } from 'next/navigation';
import type * as React from 'react';
import { addTransitionType, startTransition, ViewTransition } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type ViewTransitionTab = {
  value: string;
  label: React.ReactNode;
  href?: string;
};

type TabsNavProps = {
  items: readonly ViewTransitionTab[];
  orientation?: 'horizontal' | 'vertical';
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

function activeRouterValue(items: readonly ViewTransitionTab[], pathname: string): string {
  let bestValue = items[0]?.value ?? '';
  let bestLength = -1;
  for (const item of items) {
    if (item.href && pathname.startsWith(item.href) && item.href.length > bestLength) {
      bestValue = item.value;
      bestLength = item.href.length;
    }
  }
  return bestValue;
}

export function TabsNav({ items, orientation = 'horizontal', value, onValueChange, className }: TabsNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isRouter = value === undefined;
  const activeValue = isRouter ? activeRouterValue(items, pathname) : value;
  const activeIndex = items.findIndex((item) => item.value === activeValue);

  const select = (next: string) => {
    const nextIndex = items.findIndex((item) => item.value === next);
    if (nextIndex < 0 || nextIndex === activeIndex) return;
    startTransition(() => {
      addTransitionType(nextIndex > activeIndex ? 'slide-forward' : 'slide-backward');
      if (isRouter) {
        const href = items[nextIndex]?.href;
        if (href) router.push(href);
      } else {
        onValueChange?.(next);
      }
    });
  };

  const isVertical = orientation === 'vertical';

  return (
    <Tabs
      value={activeValue}
      orientation={orientation}
      activationMode='manual'
      onValueChange={select}
      className={cn(isVertical && 'w-44 shrink-0 border-r pr-4', className)}
    >
      <TabsList
        className={cn('bg-transparent p-0', isVertical ? 'flex h-auto w-full flex-col items-stretch gap-1' : 'gap-1')}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className={cn(
              'data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-none',
              isVertical && 'w-full justify-start px-3 py-2 text-base font-normal',
            )}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

const SLIDE_KEYFRAMES = `
@keyframes shuip-vt-from-right { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes shuip-vt-from-left { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes shuip-vt-to-left { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-30px); opacity: 0; } }
@keyframes shuip-vt-to-right { from { transform: translateX(0); opacity: 1; } to { transform: translateX(30px); opacity: 0; } }
::view-transition-old(.shuip-vt-forward) { animation: shuip-vt-to-left 0.2s ease-in-out; }
::view-transition-new(.shuip-vt-forward) { animation: shuip-vt-from-right 0.2s ease-in-out; }
::view-transition-old(.shuip-vt-backward) { animation: shuip-vt-to-right 0.2s ease-in-out; }
::view-transition-new(.shuip-vt-backward) { animation: shuip-vt-from-left 0.2s ease-in-out; }
`;

type ViewTransitionPanelProps = {
  children: React.ReactNode;
  className?: string;
};

export function ViewTransitionPanel({ children, className }: ViewTransitionPanelProps) {
  return (
    <>
      <style href='shuip-view-transition-tabs' precedence='default'>
        {SLIDE_KEYFRAMES}
      </style>
      <ViewTransition
        update={{
          default: 'none',
          'slide-forward': 'shuip-vt-forward',
          'slide-backward': 'shuip-vt-backward',
        }}
      >
        <div className={cn('min-w-0 flex-1', className)}>{children}</div>
      </ViewTransition>
    </>
  );
}
