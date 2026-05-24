'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-[6px] border border-border-subtle bg-bg-surface animate-pulse" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-border-default bg-bg-surface text-text-primary hover:bg-bg-base transition-colors relative"
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] text-brand-accent transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="h-[18px] w-[18px] text-text-secondary transition-transform duration-300 rotate-0 scale-100" />
      )}
    </button>
  );
}
