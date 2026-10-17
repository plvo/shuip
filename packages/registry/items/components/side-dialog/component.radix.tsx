'use client';

import { XIcon } from 'lucide-react';
import * as React from 'react';
import {
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogPrimitive,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SideDialogPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right';
type SideDialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface SideDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  position?: SideDialogPosition;
  size?: SideDialogSize;
  children?: React.ReactNode;
}

export interface SideDialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export interface SideDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  showCloseButton?: boolean;
  children: React.ReactNode;
}

export interface SideDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface SideDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export interface SideDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export interface SideDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface SideDialogCloseProps {
  asChild?: boolean;
  children?: React.ReactNode;
}

export interface SideDialogBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SideDialogContext = React.createContext<{
  position: SideDialogPosition;
  size: SideDialogSize;
}>({
  position: 'bottom-right',
  size: 'sm',
});

const getSizeClasses = (size: SideDialogSize) => {
  const predefinedSizes = {
    xs: 'w-full max-w-[min(20rem,calc(100vw-2rem))]',
    sm: 'w-full max-w-[min(24rem,calc(100vw-2rem))]',
    md: 'w-full max-w-[min(28rem,calc(100vw-2rem))]',
    lg: 'w-full max-w-[min(32rem,calc(100vw-2rem))]',
    xl: 'w-full max-w-[min(36rem,calc(100vw-2rem))]',
    '2xl': 'w-full max-w-[min(42rem,calc(100vw-2rem))]',
  };

  return predefinedSizes[size as keyof typeof predefinedSizes] || 'w-full max-w-[min(24rem,calc(100vw-2rem))]';
};

const getPositionClasses = (pos: SideDialogPosition, size: SideDialogSize) => {
  const baseClasses = 'fixed z-[100] bg-background border rounded-lg shadow-lg';
  const sizeClasses = getSizeClasses(size);

  switch (pos) {
    case 'top-left':
      return cn(
        baseClasses,
        sizeClasses,
        'top-4 left-4',
        'data-open:animate-in data-closed:animate-out',
        'data-closed:slide-out-to-top-52 data-closed:slide-out-to-left-52',
        'data-open:slide-in-from-top-52 data-open:slide-in-from-left-52',
      );
    case 'top-right':
      return cn(
        baseClasses,
        sizeClasses,
        'top-4 right-4',
        'data-open:animate-in data-closed:animate-out',
        'data-closed:slide-out-to-top-52 data-closed:slide-out-to-right-52',
        'data-open:slide-in-from-top-52 data-open:slide-in-from-right-52',
      );
    case 'bottom-left':
      return cn(
        baseClasses,
        sizeClasses,
        'bottom-4 left-4',
        'data-open:animate-in data-closed:animate-out',
        'data-closed:slide-out-to-bottom-52 data-closed:slide-out-to-left-52',
        'data-open:slide-in-from-bottom-52 data-open:slide-in-from-left-52',
      );
    case 'bottom-right':
      return cn(
        baseClasses,
        sizeClasses,
        'bottom-4 right-4',
        'data-open:animate-in data-closed:animate-out',
        'data-closed:slide-out-to-bottom-52 data-closed:slide-out-to-right-52',
        'data-open:slide-in-from-bottom-52 data-open:slide-in-from-left-52',
      );
    case 'left':
      return cn(
        baseClasses,
        sizeClasses,
        'left-4 top-[50%] translate-y-[-50%]',
        'data-open:animate-in data-closed:animate-out',
        'data-closed:slide-out-to-left-52',
        'data-open:slide-in-from-left-52',
      );
    case 'right':
      return cn(
        baseClasses,
        sizeClasses,
        'right-4 top-[50%] translate-y-[-50%]',
        'data-open:animate-in data-closed:animate-out',
        'data-closed:slide-out-to-right-52',
        'data-open:slide-in-from-right-52',
      );
    default:
      return cn(baseClasses, sizeClasses);
  }
};

export function SideDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  position = 'bottom-right',
  size = 'sm',
  children,
}: SideDialogProps) {
  const contextValue = React.useMemo(() => ({ position, size }), [position, size]);

  return (
    <DialogPrimitive.Root open={controlledOpen} onOpenChange={controlledOnOpenChange}>
      <SideDialogContext.Provider value={contextValue}>{children}</SideDialogContext.Provider>
    </DialogPrimitive.Root>
  );
}

export function SideDialogTrigger({ asChild, children, ...props }: SideDialogTriggerProps) {
  return (
    <DialogTrigger asChild={asChild} data-slot='side-dialog-trigger' {...props}>
      {children}
    </DialogTrigger>
  );
}

export function SideDialogContent({ showCloseButton = true, className, children, ...props }: SideDialogContentProps) {
  const { position, size } = React.useContext(SideDialogContext);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot='side-dialog-content'
        className={cn(
          getPositionClasses(position, size),
          'flex flex-col max-h-[calc(100dvh-2rem)] p-6 duration-200 outline-none',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogClose asChild>
            <Button
              variant='ghost'
              size='icon-sm'
              data-slot='side-dialog-close'
              className='absolute top-4 right-4 rounded-xs'
            >
              <XIcon className='size-4' />
              <span className='sr-only'>Close</span>
            </Button>
          </DialogClose>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function SideDialogHeader({ className, children, ...props }: SideDialogHeaderProps) {
  return (
    <div data-slot='side-dialog-header' className={cn('shrink-0 flex flex-col gap-2 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function SideDialogTitle({ className, children, ...props }: SideDialogTitleProps) {
  return (
    <DialogTitle data-slot='side-dialog-title' className={cn('text-lg font-semibold leading-none', className)} {...props}>
      {children}
    </DialogTitle>
  );
}

export function SideDialogDescription({ className, children, ...props }: SideDialogDescriptionProps) {
  return (
    <DialogDescription
      data-slot='side-dialog-description'
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    >
      {children}
    </DialogDescription>
  );
}

export function SideDialogFooter({ className, children, ...props }: SideDialogFooterProps) {
  return (
    <div
      data-slot='side-dialog-footer'
      className={cn('shrink-0 flex flex-col-reverse gap-2 mt-4 sm:flex-row sm:justify-end', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SideDialogBody({ className, children, ...props }: SideDialogBodyProps) {
  return (
    <div data-slot='side-dialog-body' className={cn('flex-1 min-h-0 overflow-y-auto', className)} {...props}>
      {children}
    </div>
  );
}

export function SideDialogClose({ asChild, children, ...props }: SideDialogCloseProps) {
  return (
    <DialogClose asChild={asChild} data-slot='side-dialog-close' {...props}>
      {children}
    </DialogClose>
  );
}