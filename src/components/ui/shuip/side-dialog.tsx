'use client';

import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import * as React from 'react';
import { createPortal } from 'react-dom';

type SideDialogPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right';
type SideDialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface SideDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  position?: SideDialogPosition;
  size?: SideDialogSize;
  children?: React.ReactNode;
}

export interface SideDialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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

export interface SideDialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children?: React.ReactNode;
}

// Context for managing dialog state
const SideDialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: SideDialogPosition;
  size: SideDialogSize;
}>({
  open: false,
  onOpenChange: () => {},
  position: 'bottom-right',
  size: 'sm',
});

export function SideDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  position = 'bottom-right',
  size = 'sm',
  children,
}: SideDialogProps) {
  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Use controlled props if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const contextValue = React.useMemo(
    () => ({
      open,
      onOpenChange,
      position,
      size,
    }),
    [open, onOpenChange, position, size],
  );

  return <SideDialogContext.Provider value={contextValue}>{children}</SideDialogContext.Provider>;
}

export function SideDialogTrigger({ asChild, children, onClick, ...props }: SideDialogTriggerProps) {
  const { onOpenChange } = React.useContext(SideDialogContext);

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onOpenChange(true);
    },
    [onClick, onOpenChange],
  );

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      ...(props as React.ButtonHTMLAttributes<HTMLButtonElement>),
    });
  }

  return (
    <button data-slot='side-dialog-trigger' onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

export function SideDialogContent({ showCloseButton = true, className, children, ...props }: SideDialogContentProps) {
  const { open, onOpenChange, position, size } = React.useContext(SideDialogContext);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  const handleOverlayClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onOpenChange(false);
      }
    },
    [onOpenChange],
  );

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
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-top-52 data-[state=closed]:slide-out-to-left-52',
          'data-[state=open]:slide-in-from-top-52 data-[state=open]:slide-in-from-left-52',
        );
      case 'top-right':
        return cn(
          baseClasses,
          sizeClasses,
          'top-4 right-4',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-top-52 data-[state=closed]:slide-out-to-right-52',
          'data-[state=open]:slide-in-from-top-52 data-[state=open]:slide-in-from-right-52',
        );
      case 'bottom-left':
        return cn(
          baseClasses,
          sizeClasses,
          'bottom-4 left-4',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-bottom-52 data-[state=closed]:slide-out-to-left-52',
          'data-[state=open]:slide-in-from-bottom-52 data-[state=open]:slide-in-from-left-52',
        );
      case 'bottom-right':
        return cn(
          baseClasses,
          sizeClasses,
          'bottom-4 right-4',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-bottom-52 data-[state=closed]:slide-out-to-right-52',
          'data-[state=open]:slide-in-from-bottom-52 data-[state=open]:slide-in-from-right-52',
        );
      case 'left':
        return cn(
          baseClasses,
          sizeClasses,
          'left-4 top-[50%] translate-y-[-50%]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-left-52',
          'data-[state=open]:slide-in-from-left-52',
        );
      case 'right':
        return cn(
          baseClasses,
          sizeClasses,
          'right-4 top-[50%] translate-y-[-50%]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-right-52',
          'data-[state=open]:slide-in-from-right-52',
        );
      default:
        return cn(baseClasses, sizeClasses);
    }
  };

  if (!mounted) return null;
  if (!open) return null;

  return createPortal(
    <div
      data-slot='side-dialog-overlay'
      className='fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
      data-state={open ? 'open' : 'closed'}
      onClick={handleOverlayClick}
    >
      <div
        data-slot='side-dialog-content'
        data-state={open ? 'open' : 'closed'}
        className={cn(getPositionClasses(position, size), 'p-6 duration-200', className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SideDialogClose className='absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden'>
            <XIcon className='size-4' />
            <span className='sr-only'>Close</span>
          </SideDialogClose>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function SideDialogHeader({ className, children, ...props }: SideDialogHeaderProps) {
  return (
    <div data-slot='side-dialog-header' className={cn('flex flex-col gap-2 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function SideDialogTitle({ className, children, ...props }: SideDialogTitleProps) {
  return (
    <h2 data-slot='side-dialog-title' className={cn('text-lg font-semibold leading-none', className)} {...props}>
      {children}
    </h2>
  );
}

export function SideDialogDescription({ className, children, ...props }: SideDialogDescriptionProps) {
  return (
    <p data-slot='side-dialog-description' className={cn('text-muted-foreground text-sm', className)} {...props}>
      {children}
    </p>
  );
}

export function SideDialogFooter({ className, children, ...props }: SideDialogFooterProps) {
  return (
    <div
      data-slot='side-dialog-footer'
      className={cn('flex flex-col-reverse gap-2 mt-4 sm:flex-row sm:justify-end', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SideDialogClose({ asChild, children, onClick, ...props }: SideDialogCloseProps) {
  const { onOpenChange } = React.useContext(SideDialogContext);

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onOpenChange(false);
    },
    [onClick, onOpenChange],
  );

  if (asChild && children) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      ...(props as React.HTMLAttributes<HTMLButtonElement>),
    });
  }

  return (
    <button data-slot='side-dialog-close' onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
