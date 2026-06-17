import Link from 'next/link';
import { TabsNav, ViewTransitionPanel, type ViewTransitionTab } from '@/components/block/shuip/view-transition-tabs';

const TABS: ViewTransitionTab[] = [
  { value: 'account', label: 'Account', href: '/demo/view-transition-tabs/account' },
  { value: 'security', label: 'Security', href: '/demo/view-transition-tabs/security' },
  { value: 'sessions', label: 'Sessions', href: '/demo/view-transition-tabs/sessions' },
  { value: 'preferences', label: 'Preferences', href: '/demo/view-transition-tabs/preferences' },
];

export default function ViewTransitionTabsDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className='mx-auto w-full max-w-3xl px-6 py-16'>
      <div className='mb-10 space-y-1'>
        <Link
          href='/blocks/view-transition-tabs'
          className='text-sm text-muted-foreground underline-offset-4 hover:underline'
        >
          ← Back to docs
        </Link>
        <h1 className='text-2xl font-semibold'>View Transition Tabs — router demo</h1>
        <p className='text-sm text-muted-foreground'>
          Each tab is a real route. Watch the URL change and the panel slide as you navigate.
        </p>
      </div>

      <div className='flex gap-8'>
        <TabsNav items={TABS} orientation='vertical' />
        <ViewTransitionPanel>{children}</ViewTransitionPanel>
      </div>
    </main>
  );
}
