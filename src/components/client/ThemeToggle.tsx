'use client';
import { useEffect, useState } from 'react';
import { Icon } from '../Icon.tsx';

type Theme = 'light' | 'dark';

function effective(): Theme {
  const saved = document.documentElement.getAttribute('data-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle({ label }: { label: string }) {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => setTheme(effective()), []);
  const toggle = () => {
    const next: Theme = effective() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
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
