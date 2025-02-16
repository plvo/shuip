'use client';

import * as React from 'react';
import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export default function ButtonTheme({ withText }: { withText?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = React.useState<'system' | 'light' | 'dark'>('system');

  React.useEffect(() => {
    setCurrentTheme(theme as 'system' | 'light' | 'dark');
  }, [theme]);

  const cycleTheme = () => {
    const themes: ('system' | 'light' | 'dark')[] = ['system', 'light', 'dark'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <Button variant="outline" size={withText ? 'default' : 'icon'} onClick={cycleTheme}>
      {currentTheme === 'system' && <Laptop className="h-[1.2rem] w-[1.2rem]" />}
      {currentTheme === 'light' && <Sun className="h-[1.2rem] w-[1.2rem]" />}
      {currentTheme === 'dark' && <Moon className="h-[1.2rem] w-[1.2rem]" />}
      {withText && (
        <span className="ml-2 capitalize">
          {currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}
        </span>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
