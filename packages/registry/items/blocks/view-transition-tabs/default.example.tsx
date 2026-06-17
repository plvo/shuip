'use client';

import { useState } from 'react';
import { TabsNav, ViewTransitionPanel, type ViewTransitionTab } from '@/components/block/shuip/view-transition-tabs';

const TABS: ViewTransitionTab[] = [
  { value: 'account', label: 'Account' },
  { value: 'security', label: 'Security' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'preferences', label: 'Preferences' },
];

const CONTENT: Record<string, { title: string; body: string }> = {
  account: { title: 'Account', body: 'Update your name, email and public profile information.' },
  security: { title: 'Security', body: 'Manage your password, two-factor authentication and recovery codes.' },
  sessions: { title: 'Sessions', body: 'Review the devices currently signed in to your account.' },
  preferences: { title: 'Preferences', body: 'Choose your theme, language and notification settings.' },
};

export default function ViewTransitionTabsExample() {
  const [active, setActive] = useState('account');
  const view = CONTENT[active];

  return (
    <div className='flex w-[34rem] max-w-full gap-8'>
      <TabsNav items={TABS} orientation='vertical' value={active} onValueChange={setActive} />
      <ViewTransitionPanel>
        <div className='min-h-24 space-y-2'>
          <h3 className='text-lg font-semibold'>{view.title}</h3>
          <p className='text-sm text-muted-foreground'>{view.body}</p>
        </div>
      </ViewTransitionPanel>
    </div>
  );
}
