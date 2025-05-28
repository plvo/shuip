import { Button } from '@/components/ui/button';
import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';

type Theme = 'system' | 'light' | 'dark';

export interface ThemeButtonProps {
  withText?: boolean;
}

export function ThemeButton({ withText }: ThemeButtonProps) {
  const { theme, setTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = React.useState<Theme>('system');

  React.useEffect(() => {
    setCurrentTheme(theme as Theme);
  }, [theme]);

  const cycleTheme = () => {
    const themes: Theme[] = ['system', 'light', 'dark'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'system':
        return <Laptop className='size-[1.2rem]' />;
      case 'light':
        return <Sun className='size-[1.2rem]' />;
      case 'dark':
        return <Moon className='size-[1.2rem]' />;
    }
  };

  const getThemeText = () => {
    return currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
  };

  return (
    <Button variant='outline' size={withText ? 'default' : 'icon'} onClick={cycleTheme}>
      {getThemeIcon()}
      {withText && <span className='ml-2 capitalize'>{getThemeText()}</span>}
      <span className='sr-only'>Toggle theme</span>
    </Button>
  );
}
