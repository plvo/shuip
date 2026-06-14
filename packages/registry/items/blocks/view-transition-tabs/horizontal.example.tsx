'use client';

import { useState } from 'react';
import { TabsNav, ViewTransitionPanel, type ViewTransitionTab } from '@/components/block/shuip/view-transition-tabs';

const TABS: ViewTransitionTab[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'personas', label: 'Personas' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'team', label: 'Team' },
];

const CONTENT: Record<string, { title: string; body: string }> = {
  overview: { title: 'Overview', body: 'High-level health and the latest signals for this product.' },
  personas: { title: 'Personas', body: 'The audiences you are building for and their core needs.' },
  tickets: { title: 'Tickets', body: 'Work in progress, grouped by stage and priority.' },
  team: { title: 'Team', body: 'Who owns what, and the people contributing to this product.' },
};

export default function ViewTransitionTabsHorizontalExample() {
  const [active, setActive] = useState('overview');
  const view = CONTENT[active];

  return (
    <div className='space-y-6'>
      <TabsNav items={TABS} value={active} onValueChange={setActive} />
      <ViewTransitionPanel>
        <div className='space-y-2'>
          <h3 className='text-lg font-semibold'>{view.title}</h3>
          <p className='text-sm text-muted-foreground'>{view.body}</p>
        </div>
      </ViewTransitionPanel>
    </div>
  );
}
