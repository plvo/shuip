'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import {
  ResponsiveDialog,
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
import { InputField } from '@/components/ui/shuip/input-field';
import { SubmitButton } from '@/components/ui/shuip/submit-button';

export default function ResponsiveDialogExample() {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Basic Responsive Dialog</h3>
      <div className='flex flex-wrap gap-2'>
        <ResponsiveDialog>
          <ResponsiveDialogTrigger asChild>
            <Button variant='outline'>Open Dialog</Button>
          </ResponsiveDialogTrigger>
          <ResponsiveDialogContent>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Responsive Dialog</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                This dialog adapts to your screen size. On desktop, it's a side dialog. On mobile, it's a drawer.
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <div className='p-4'>
              <p className='text-sm text-muted-foreground'>
                Try resizing your browser window or switching to mobile view to see the responsive behavior.
              </p>
            </div>
            <ResponsiveDialogFooter>
              <ResponsiveDialogClose asChild>
                <Button variant='outline'>Close</Button>
              </ResponsiveDialogClose>
              <Button>Continue</Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </div>

      <div className='space-y-2'>
        <h3 className='text-lg font-semibold'>Different Positions (Desktop only)</h3>
        <div className='flex flex-wrap gap-2'>
          <ResponsiveDialog position='top-left'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Top Left</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Top Left Dialog</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>Positioned at top left on desktop.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog position='top-right'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Top Right</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Top Right Dialog</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>Positioned at top right on desktop.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog position='bottom-left'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Bottom Left</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Bottom Left Dialog</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>Positioned at bottom left on desktop.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog position='bottom-right'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Bottom Right</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Bottom Right Dialog</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>Positioned at bottom right on desktop.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog position='left'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Left</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Left Dialog</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>Positioned at left side on desktop.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog position='right'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Right</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Right Dialog</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>Positioned at right side on desktop.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>
      </div>

      <div className='space-y-2'>
        <h3 className='text-lg font-semibold'>Different Sizes (Desktop only)</h3>
        <div className='flex flex-wrap gap-2'>
          <ResponsiveDialog size='xs'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Extra Small</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>XS Dialog</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>Extra small dialog size.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog size='sm'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Small</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Small Dialog</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>Small dialog size (default).</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog size='md'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Medium</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Medium Dialog</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>Medium dialog size.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog size='lg'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Large</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Large Dialog</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>Large dialog size for more content.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog size='xl'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Extra Large</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>XL Dialog</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>Extra large dialog size.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog size='2xl'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>2X Large</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>2XL Dialog</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>2X large dialog size for extensive content.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>
      </div>

      <div className='space-y-2'>
        <h3 className='text-lg font-semibold'>Custom Breakpoints</h3>
        <div className='flex flex-wrap gap-2'>
          <ResponsiveDialog breakpoint='sm'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Breakpoint SM (640px)</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Small Breakpoint</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  This dialog switches to mobile mode at 640px and below.
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog breakpoint='md'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Breakpoint MD (768px)</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Medium Breakpoint</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  This dialog switches to mobile mode at 768px and below (default).
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog breakpoint='lg'>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Breakpoint LG (1024px)</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Large Breakpoint</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  This dialog switches to mobile mode at 1024px and below.
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog breakpoint={900}>
            <ResponsiveDialogTrigger asChild>
              <Button variant='outline'>Custom 900px</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Custom Breakpoint</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  This dialog switches to mobile mode at exactly 900px and below.
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>
      </div>

      <h3 className='text-lg font-semibold'>Form Example</h3>

      <ResponsiveDialogFormExample />
    </div>
  );
}

const formSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

function ResponsiveDialogFormExample() {
  const [open, setOpen] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    alert(JSON.stringify(data));
    setOpen(false);
    form.reset();
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button variant='outline'>Open Dialog</Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Responsive Dialog</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                This dialog adapts to your screen size. On desktop, it's a side dialog. On mobile, it's a drawer.
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <div className='space-y-4 px-4'>
              <InputField register={form.register('name')} name='name' label='Name' />
              <InputField register={form.register('email')} name='email' label='Email' />
            </div>
            <ResponsiveDialogFooter>
              <ResponsiveDialogClose asChild>
                <Button variant='outline'>Close</Button>
              </ResponsiveDialogClose>
              <SubmitButton className='max-md:w-full'>Submit</SubmitButton>
            </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
