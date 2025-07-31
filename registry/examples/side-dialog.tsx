'use client';

import { Button } from '@/components/ui/button';
import {
  SideDialog,
  SideDialogClose,
  SideDialogContent,
  SideDialogDescription,
  SideDialogFooter,
  SideDialogHeader,
  SideDialogTitle,
  SideDialogTrigger,
} from '@/components/ui/shuip/side-dialog';
import { useState } from 'react';

export default function SideDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className='flex flex-wrap gap-4 p-8'>
      <SideDialog open={open} onOpenChange={setOpen}>
        <SideDialogTrigger asChild>
          <Button variant='outline'>Open Dialog (Bottom Right)</Button>
        </SideDialogTrigger>
        <SideDialogContent>
          <SideDialogHeader>
            <SideDialogTitle>Side Dialog Example</SideDialogTitle>
            <SideDialogDescription>
              This is a side dialog that opens on the bottom right by default. On mobile devices, it automatically
              becomes a drawer.
            </SideDialogDescription>
          </SideDialogHeader>
          <div className='py-4'>
            <p className='text-sm text-muted-foreground'>
              Content goes here. This dialog is responsive and will adapt to mobile devices by showing as a drawer
              instead.
            </p>
          </div>
          <SideDialogFooter>
            <SideDialogClose asChild>
              <Button variant='outline'>Cancel</Button>
            </SideDialogClose>
            <Button>Save changes</Button>
          </SideDialogFooter>
        </SideDialogContent>
      </SideDialog>

      <SideDialog position='top-left'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>Top Left</Button>
        </SideDialogTrigger>
        <SideDialogContent>
          <SideDialogHeader>
            <SideDialogTitle>Top Left Dialog</SideDialogTitle>
            <SideDialogDescription>This dialog opens from the top left corner.</SideDialogDescription>
          </SideDialogHeader>
          <div className='py-4'>
            <p className='text-sm'>Perfect for notifications or quick actions.</p>
          </div>
        </SideDialogContent>
      </SideDialog>

      <SideDialog position='top-right'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>Top Right</Button>
        </SideDialogTrigger>
        <SideDialogContent>
          <SideDialogHeader>
            <SideDialogTitle>Top Right Dialog</SideDialogTitle>
            <SideDialogDescription>This dialog opens from the top right corner.</SideDialogDescription>
          </SideDialogHeader>
          <div className='py-4'>
            <p className='text-sm'>Great for user menus or profile settings.</p>
          </div>
        </SideDialogContent>
      </SideDialog>

      <SideDialog position='bottom-left'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>Bottom Left</Button>
        </SideDialogTrigger>
        <SideDialogContent>
          <SideDialogHeader>
            <SideDialogTitle>Bottom Left Dialog</SideDialogTitle>
            <SideDialogDescription>This dialog opens from the bottom left corner.</SideDialogDescription>
          </SideDialogHeader>
          <div className='py-4'>
            <p className='text-sm'>Ideal for help or support content.</p>
          </div>
        </SideDialogContent>
      </SideDialog>

      <SideDialog position='left'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>Left Side</Button>
        </SideDialogTrigger>
        <SideDialogContent>
          <SideDialogHeader>
            <SideDialogTitle>Left Side Dialog</SideDialogTitle>
            <SideDialogDescription>This dialog opens from the left side, centered vertically.</SideDialogDescription>
          </SideDialogHeader>
          <div className='py-4'>
            <p className='text-sm'>Perfect for navigation or filters.</p>
          </div>
        </SideDialogContent>
      </SideDialog>

      <SideDialog position='right'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>Right Side</Button>
        </SideDialogTrigger>
        <SideDialogContent>
          <SideDialogHeader>
            <SideDialogTitle>Right Side Dialog</SideDialogTitle>
            <SideDialogDescription>This dialog opens from the right side, centered vertically.</SideDialogDescription>
          </SideDialogHeader>
          <div className='py-4'>
            <p className='text-sm'>Great for sidebars or additional information.</p>
          </div>
          <SideDialogFooter>
            <SideDialogClose asChild>
              <Button variant='outline'>Close</Button>
            </SideDialogClose>
          </SideDialogFooter>
        </SideDialogContent>
      </SideDialog>

      <SideDialog>
        <SideDialogTrigger asChild>
          <Button variant='outline'>No Close Button</Button>
        </SideDialogTrigger>
        <SideDialogContent showCloseButton={false}>
          <SideDialogHeader>
            <SideDialogTitle>Custom Close</SideDialogTitle>
            <SideDialogDescription>This dialog doesn't show the default close button.</SideDialogDescription>
          </SideDialogHeader>
          <div className='py-4'>
            <p className='text-sm'>You can control closing with custom buttons only.</p>
          </div>
          <SideDialogFooter>
            <SideDialogClose asChild>
              <Button>Done</Button>
            </SideDialogClose>
          </SideDialogFooter>
        </SideDialogContent>
      </SideDialog>

      {/* Different Sizes */}
      <SideDialog size='xs'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>Extra Small (xs)</Button>
        </SideDialogTrigger>
        <SideDialogContent>
          <SideDialogHeader>
            <SideDialogTitle>XS Size</SideDialogTitle>
            <SideDialogDescription>Extra small dialog size (320px max).</SideDialogDescription>
          </SideDialogHeader>
        </SideDialogContent>
      </SideDialog>

      <SideDialog size='md' position='top-left'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>Medium (md)</Button>
        </SideDialogTrigger>
        <SideDialogContent>
          <SideDialogHeader>
            <SideDialogTitle>MD Size</SideDialogTitle>
            <SideDialogDescription>Medium dialog size (448px max).</SideDialogDescription>
          </SideDialogHeader>
        </SideDialogContent>
      </SideDialog>

      <SideDialog size='xl' position='left'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>Extra Large (xl)</Button>
        </SideDialogTrigger>
        <SideDialogContent>
          <SideDialogHeader>
            <SideDialogTitle>XL Size</SideDialogTitle>
            <SideDialogDescription>Extra large dialog size (576px max).</SideDialogDescription>
          </SideDialogHeader>
        </SideDialogContent>
      </SideDialog>

      <SideDialog size='2xl' position='bottom-left'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>2XL Size</Button>
        </SideDialogTrigger>
        <SideDialogContent>
          <SideDialogHeader>
            <SideDialogTitle>2XL Size</SideDialogTitle>
            <SideDialogDescription>Extra extra large dialog size (672px max).</SideDialogDescription>
          </SideDialogHeader>
        </SideDialogContent>
      </SideDialog>

      <SideDialog position='right'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>Custom 400px</Button>
        </SideDialogTrigger>
        <SideDialogContent className='w-full max-w-[min(400px,calc(100vw-2rem))]'>
          <SideDialogHeader>
            <SideDialogTitle>Custom Size</SideDialogTitle>
            <SideDialogDescription>Custom size of 400px with responsive constraints.</SideDialogDescription>
          </SideDialogHeader>
        </SideDialogContent>
      </SideDialog>

      <SideDialog position='bottom-left'>
        <SideDialogTrigger asChild>
          <Button variant='outline'>50% Viewport</Button>
        </SideDialogTrigger>
        <SideDialogContent className='w-full max-w-[min(50vw,calc(100vw-2rem))]'>
          <SideDialogHeader>
            <SideDialogTitle>Viewport Size</SideDialogTitle>
            <SideDialogDescription>50% of viewport width with responsive constraints.</SideDialogDescription>
          </SideDialogHeader>
        </SideDialogContent>
      </SideDialog>

      <SideDialog>
        <SideDialogTrigger asChild>
          <Button variant='outline' className='bg-gradient-to-r from-blue-300 to-purple-300'>
            Colored
          </Button>
        </SideDialogTrigger>
        <SideDialogContent className='bg-gradient-to-r from-blue-300 to-purple-300'>
          <SideDialogHeader>
            <SideDialogTitle>Colored</SideDialogTitle>
            <SideDialogDescription>Colored dialog.</SideDialogDescription>
          </SideDialogHeader>
        </SideDialogContent>
      </SideDialog>
    </div>
  );
}
