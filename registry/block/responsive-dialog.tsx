'use client';

import * as React from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
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

type ResponsiveDialogPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right';
type ResponsiveDialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type ResponsiveDialogBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | number;

export interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  position?: ResponsiveDialogPosition;
  size?: ResponsiveDialogSize;
  breakpoint?: ResponsiveDialogBreakpoint;
  children?: React.ReactNode;
}

export interface ResponsiveDialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

export interface ResponsiveDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  showCloseButton?: boolean;
  children: React.ReactNode;
}

export interface ResponsiveDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface ResponsiveDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export interface ResponsiveDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export interface ResponsiveDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface ResponsiveDialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children?: React.ReactNode;
}

// Helper function to convert breakpoint to pixels
const getBreakpointValue = (breakpoint: ResponsiveDialogBreakpoint): number => {
  if (typeof breakpoint === 'number') {
    return breakpoint;
  }

  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  };

  return breakpoints[breakpoint];
};

// Custom hook for responsive breakpoint detection
const useCustomBreakpoint = (breakpoint: ResponsiveDialogBreakpoint) => {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const breakpointValue = getBreakpointValue(breakpoint);
    const mql = window.matchMedia(`(max-width: ${breakpointValue - 1}px)`);

    const onChange = () => {
      setIsMobile(window.innerWidth < breakpointValue);
    };

    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < breakpointValue);

    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return !!isMobile;
};

// Context for managing responsive state
const ResponsiveDialogContext = React.createContext<{
  isMobile: boolean;
}>({
  isMobile: false,
});

export function ResponsiveDialog({
  open,
  onOpenChange,
  position = 'bottom-right',
  size = 'sm',
  breakpoint = 'md',
  children,
}: ResponsiveDialogProps) {
  const isMobile = useCustomBreakpoint(breakpoint);

  return (
    <ResponsiveDialogContext.Provider value={{ isMobile }}>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      ) : (
        <SideDialog open={open} onOpenChange={onOpenChange} position={position} size={size}>
          {children}
        </SideDialog>
      )}
    </ResponsiveDialogContext.Provider>
  );
}

export function ResponsiveDialogTrigger({ asChild, children, ...props }: ResponsiveDialogTriggerProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerTrigger asChild={asChild} {...props}>
        {children}
      </DrawerTrigger>
    );
  }

  return (
    <SideDialogTrigger asChild={asChild} {...props}>
      {children}
    </SideDialogTrigger>
  );
}

export function ResponsiveDialogContent({
  showCloseButton = true,
  className,
  children,
  ...props
}: ResponsiveDialogContentProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerContent className={className} {...props}>
        {children}
      </DrawerContent>
    );
  }

  return (
    <SideDialogContent showCloseButton={showCloseButton} className={className} {...props}>
      {children}
    </SideDialogContent>
  );
}

export function ResponsiveDialogHeader({ className, children, ...props }: ResponsiveDialogHeaderProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerHeader className={className} {...props}>
        {children}
      </DrawerHeader>
    );
  }

  return (
    <SideDialogHeader className={className} {...props}>
      {children}
    </SideDialogHeader>
  );
}

export function ResponsiveDialogTitle({ className, children, ...props }: ResponsiveDialogTitleProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerTitle className={className} {...props}>
        {children}
      </DrawerTitle>
    );
  }

  return (
    <SideDialogTitle className={className} {...props}>
      {children}
    </SideDialogTitle>
  );
}

export function ResponsiveDialogDescription({ className, children, ...props }: ResponsiveDialogDescriptionProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerDescription className={className} {...props}>
        {children}
      </DrawerDescription>
    );
  }

  return (
    <SideDialogDescription className={className} {...props}>
      {children}
    </SideDialogDescription>
  );
}

export function ResponsiveDialogFooter({ className, children, ...props }: ResponsiveDialogFooterProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerFooter className={className} {...props}>
        {children}
      </DrawerFooter>
    );
  }

  return (
    <SideDialogFooter className={className} {...props}>
      {children}
    </SideDialogFooter>
  );
}

export function ResponsiveDialogClose({ asChild, children, ...props }: ResponsiveDialogCloseProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerClose asChild={asChild} {...props}>
        {children}
      </DrawerClose>
    );
  }

  return (
    <SideDialogClose asChild={asChild} {...props}>
      {children}
    </SideDialogClose>
  );
}
