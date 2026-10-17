'use client';

import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type * as React from 'react';
import { previewGroupId } from '@/lib/tab-groups';

export interface ItemPreviewProps {
  /** The registry key of the example, which names the group that remembers its tab. */
  exampleKey: string;
  /** The highlighted source of the example. */
  source: React.ReactNode;
  children: React.ReactNode;
}

export function ItemPreview({ exampleKey, source, children }: ItemPreviewProps) {
  return (
    <Tabs items={['preview', 'code']} groupId={previewGroupId(exampleKey)} persist>
      <Tab className='p-0'>{children}</Tab>
      <Tab>{source}</Tab>
    </Tabs>
  );
}
