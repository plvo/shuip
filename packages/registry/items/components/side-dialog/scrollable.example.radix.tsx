'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  SideDialog,
  SideDialogBody,
  SideDialogClose,
  SideDialogContent,
  SideDialogDescription,
  SideDialogFooter,
  SideDialogHeader,
  SideDialogTitle,
  SideDialogTrigger,
} from '@/components/ui/shuip/side-dialog';

const ACTIVITY_LOG = [
  { id: 1, user: 'Alice Martin', action: 'Updated billing address', time: '2 minutes ago', type: 'edit' },
  { id: 2, user: 'Bob Chen', action: 'Exported 847 records to CSV', time: '14 minutes ago', type: 'export' },
  { id: 3, user: 'Alice Martin', action: 'Invited carol@example.com', time: '1 hour ago', type: 'invite' },
  { id: 4, user: 'System', action: 'Scheduled backup completed', time: '2 hours ago', type: 'system' },
  { id: 5, user: 'Dave Wilson', action: 'Deleted workspace "Legacy"', time: '3 hours ago', type: 'delete' },
  { id: 6, user: 'Alice Martin', action: 'Changed plan to Pro', time: '5 hours ago', type: 'edit' },
  { id: 7, user: 'Bob Chen', action: 'Created API key "Production"', time: '6 hours ago', type: 'create' },
  { id: 8, user: 'System', action: 'SSL certificate renewed', time: 'Yesterday at 11:42 PM', type: 'system' },
  { id: 9, user: 'Dave Wilson', action: 'Added 3 new team members', time: 'Yesterday at 4:12 PM', type: 'invite' },
  { id: 10, user: 'Carol Lee', action: 'Reset 2FA for bob@example.com', time: 'Yesterday at 2:05 PM', type: 'edit' },
  { id: 11, user: 'Alice Martin', action: 'Enabled SSO for domain acme.com', time: '2 days ago', type: 'edit' },
  { id: 12, user: 'System', action: 'Monthly invoice generated — $429.00', time: '3 days ago', type: 'system' },
  { id: 13, user: 'Bob Chen', action: 'Revoked API key "Staging"', time: '3 days ago', type: 'delete' },
  { id: 14, user: 'Carol Lee', action: 'Updated webhook endpoint', time: '4 days ago', type: 'edit' },
  { id: 15, user: 'Dave Wilson', action: 'Archived project "Q3 Campaign"', time: '5 days ago', type: 'edit' },
];

const TYPE_COLORS: Record<string, string> = {
  edit: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  export: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  invite: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  system: 'bg-muted text-muted-foreground',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function SideDialogScrollableExample() {
  return (
    <div className='flex flex-wrap gap-3'>
      <SideDialog position='bottom-right' size='md'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>Activity Log</Button>
        </SideDialogTrigger>
        <SideDialogContent>
          <SideDialogHeader>
            <SideDialogTitle>Activity Log</SideDialogTitle>
            <SideDialogDescription>Recent actions across your workspace.</SideDialogDescription>
          </SideDialogHeader>
          <SideDialogBody className='space-y-1'>
            {ACTIVITY_LOG.map((entry, i) => (
              <div key={entry.id}>
                <div className='flex items-start gap-3 py-2.5'>
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium capitalize ${TYPE_COLORS[entry.type]}`}
                  >
                    {entry.type}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm leading-snug'>{entry.action}</p>
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                      {entry.user} · {entry.time}
                    </p>
                  </div>
                </div>
                {i < ACTIVITY_LOG.length - 1 && <Separator />}
              </div>
            ))}
          </SideDialogBody>
          <SideDialogFooter>
            <SideDialogClose asChild>
              <Button variant='outline' className='w-full'>
                Close
              </Button>
            </SideDialogClose>
          </SideDialogFooter>
        </SideDialogContent>
      </SideDialog>

      <SideDialog position='right' size='sm'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>Notifications</Button>
        </SideDialogTrigger>
        <SideDialogContent>
          <SideDialogHeader>
            <SideDialogTitle>Notifications</SideDialogTitle>
            <SideDialogDescription>You have 8 unread notifications.</SideDialogDescription>
          </SideDialogHeader>
          <SideDialogBody className='space-y-3'>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className='flex items-start gap-3 rounded-md border p-3'>
                <div className={`mt-1 size-2 shrink-0 rounded-full ${i < 8 ? 'bg-blue-500' : 'bg-transparent'}`} />
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium leading-snug'>
                    {
                      [
                        'New comment on your post',
                        'Alice mentioned you in a thread',
                        'Your export is ready to download',
                        'Dave accepted your invitation',
                        'Payment processed successfully',
                        'Your API key is expiring soon',
                        'New login from Chrome on macOS',
                        'Weekly report is available',
                        'Bob replied to your comment',
                        'Scheduled maintenance tonight',
                        'Your trial ends in 3 days',
                        'New feature: AI summaries',
                      ][i]
                    }
                  </p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>{i === 0 ? 'Just now' : `${i * 2 + 1}h ago`}</p>
                </div>
              </div>
            ))}
          </SideDialogBody>
          <SideDialogFooter>
            <Button variant='ghost' size='sm' className='w-full'>
              Mark all as read
            </Button>
          </SideDialogFooter>
        </SideDialogContent>
      </SideDialog>
    </div>
  );
}
