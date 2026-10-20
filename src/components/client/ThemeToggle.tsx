'use client';
import { useEffect, useState } from 'react';
import { Icon } from '../Icon.tsx';

type Theme = 'light' | 'dark';

/** Dark is the default (set on <html> by the server); only an explicit "light" differs. */
function effective(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function ThemeToggle({ label }: { label: string }) {
  const [theme, setTheme] = useState<Theme>('dark');
  useEffect(() => setTheme(effective()), []);
  const toggle = () => {
    const next: Theme = effective() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    document.getElementById('hc-theme-color')?.setAttribute('content', next === 'light' ? '#fffbf5' : '#0e1815');
    try {
      localStorage.setItem('hc-theme', next);
    } catch {
      /* storage blocked */
    }
    setTheme(next);
  };
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={label} aria-pressed={theme === 'dark'}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
