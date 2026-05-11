'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/block/shuip/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { InputField } from '@/components/ui/shuip/react-hook-form/input-field';
import { SelectField } from '@/components/ui/shuip/react-hook-form/select-field';
import { TextareaField } from '@/components/ui/shuip/react-hook-form/textarea-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

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

export default function ResponsiveDialogScrollableExample() {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Scrollable Content</h3>
      <div className='flex flex-wrap gap-2'>
        <ResponsiveDialog position='bottom-right' size='md'>
          <ResponsiveDialogTrigger asChild>
            <Button variant='outline'>Activity Log</Button>
          </ResponsiveDialogTrigger>
          <ResponsiveDialogContent>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Activity Log</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>Recent actions across your workspace.</ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody className='space-y-1'>
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
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
              <ResponsiveDialogClose asChild>
                <Button variant='outline' className='max-md:w-full'>
                  Close
                </Button>
              </ResponsiveDialogClose>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>

        <LongFormDialog />
      </div>
    </div>
  );
}

const longFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().min(1),
  country: z.string().min(1),
  bio: z.string().optional(),
});

function LongFormDialog() {
  const [open, setOpen] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(longFormSchema),
  });

  const onSubmit = async (data: z.infer<typeof longFormSchema>) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(JSON.stringify(data, null, 2));
    setOpen(false);
    form.reset();
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen} position='right' size='md'>
      <ResponsiveDialogTrigger asChild>
        <Button variant='outline'>Long Form</Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col flex-1 min-h-0'>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Create Profile</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                Fill in your details to create your team profile.
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody className='space-y-4'>
              <div className='grid grid-cols-2 gap-3'>
                <InputField register={form.register('firstName')} name='firstName' label='First name' />
                <InputField register={form.register('lastName')} name='lastName' label='Last name' />
              </div>
              <InputField register={form.register('email')} name='email' label='Email' type='email' />
              <InputField register={form.register('phone')} name='phone' label='Phone' type='tel' />
              <InputField register={form.register('company')} name='company' label='Company' />
              <SelectField
                register={form.register('role')}
                name='role'
                label='Role'
                options={{
                  Admin: 'admin',
                  Developer: 'developer',
                  Designer: 'designer',
                  Manager: 'manager',
                  Viewer: 'viewer',
                }}
              />

              <SelectField
                register={form.register('country')}
                name='country'
                label='Country'
                options={{
                  France: 'fr',
                  Germany: 'de',
                  'United States': 'us',
                  'United Kingdom': 'gb',
                  Canada: 'ca',
                  Australia: 'au',
                }}
              />
              <TextareaField register={form.register('bio')} name='bio' label='Bio' rows={4} />
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
              <ResponsiveDialogClose asChild>
                <Button variant='outline' className='max-md:w-full'>
                  Cancel
                </Button>
              </ResponsiveDialogClose>
              <SubmitButton className='max-md:w-full'>Create Profile</SubmitButton>
            </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
