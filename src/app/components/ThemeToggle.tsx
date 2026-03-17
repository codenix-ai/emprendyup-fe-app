'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type ThemeToggleProps = {
  compact?: boolean;
  className?: string;
};

export function ThemeToggle({ compact = false, className = '' }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const nextTheme = isDark ? 'light' : 'dark';
  const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        aria-label={label}
        title={label}
        data-testid="theme-toggle-button-compact"
        className={[
          'inline-flex h-10 w-10 items-center justify-center rounded-2xl border shadow-sm transition',
          'border-slate-200/80 bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md',
          'dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-sky-400',
          className,
        ].join(' ')}
      >
        <span
          className={[
            'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
            isDark
              ? 'bg-slate-800 text-amber-300 ring-1 ring-white/10'
              : 'bg-amber-100 text-amber-600 ring-1 ring-amber-200',
          ].join(' ')}
        >
          {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      title={label}
      data-testid="theme-toggle-button"
      className={[
        'group inline-flex h-11 items-center gap-3 rounded-2xl border px-3 py-2 text-left shadow-sm transition',
        'border-slate-200/80 bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md',
        'dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-sky-400',
        className,
      ].join(' ')}
    >
      <span
        className={[
          'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
          isDark
            ? 'bg-slate-800 text-amber-300 ring-1 ring-white/10'
            : 'bg-amber-100 text-amber-600 ring-1 ring-amber-200',
        ].join(' ')}
      >
        {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      </span>

      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
          Tema
        </span>
        <span className="block text-sm font-semibold text-slate-700 dark:text-slate-100">
          {isDark ? 'Oscuro' : 'Claro'}
        </span>
      </span>
    </button>
  );
}
