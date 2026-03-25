'use client';

import { cn } from '@/lib/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Variant = 'spinner' | 'dots' | 'bars';

interface LoaderProps {
  /** Visual style */
  variant?: Variant;
  /** Size preset */
  size?: Size;
  /** Optional label shown below the animation */
  text?: string;
  /** Take over the full viewport */
  fullScreen?: boolean;
  /** Fill its parent container (flex-centered) */
  fill?: boolean;
  /** Extra class names on the wrapper */
  className?: string;
}

// ─── Size maps ────────────────────────────────────────────────────────────────

const spinnerSize: Record<Size, string> = {
  xs: 'h-4 w-4 border-2',
  sm: 'h-6 w-6 border-2',
  md: 'h-9 w-9 border-[3px]',
  lg: 'h-14 w-14 border-4',
  xl: 'h-20 w-20 border-[5px]',
};

const textSize: Record<Size, string> = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

const dotSize: Record<Size, string> = {
  xs: 'h-1 w-1',
  sm: 'h-1.5 w-1.5',
  md: 'h-2.5 w-2.5',
  lg: 'h-3.5 w-3.5',
  xl: 'h-5 w-5',
};

const barSize: Record<Size, string> = {
  xs: 'h-3 w-0.5',
  sm: 'h-4 w-1',
  md: 'h-6 w-1.5',
  lg: 'h-9 w-2',
  xl: 'h-12 w-2.5',
};

// ─── Animation variants ───────────────────────────────────────────────────────

function Spinner({ size = 'md' }: { size?: Size }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full animate-spin',
        'border-primary-200 border-t-primary-400',
        spinnerSize[size]
      )}
      aria-hidden
    />
  );
}

function Dots({ size = 'md' }: { size?: Size }) {
  return (
    <span className="flex items-center gap-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn('rounded-full bg-primary-400 animate-bounce', dotSize[size])}
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </span>
  );
}

function Bars({ size = 'md' }: { size?: Size }) {
  return (
    <span className="flex items-end gap-1" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn('rounded-sm bg-primary-400', barSize[size])}
          style={{
            animation: 'emprendy-bar 1.1s ease-in-out infinite',
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Loader({
  variant = 'spinner',
  size = 'md',
  text,
  fullScreen = false,
  fill = false,
  className,
}: LoaderProps) {
  const animation =
    variant === 'dots' ? (
      <Dots size={size} />
    ) : variant === 'bars' ? (
      <Bars size={size} />
    ) : (
      <Spinner size={size} />
    );

  const content = (
    <div
      role="status"
      aria-label={text ?? 'Cargando'}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        (fullScreen || fill) && 'flex-1',
        className
      )}
    >
      {animation}
      {text && (
        <p
          className={cn(
            'font-medium text-gray-500 dark:text-gray-400 animate-pulse',
            textSize[size]
          )}
        >
          {text}
        </p>
      )}
      <span className="sr-only">{text ?? 'Cargando'}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  if (fill) {
    return <div className="flex min-h-[200px] w-full items-center justify-center">{content}</div>;
  }

  return content;
}

// ─── Shorthand presets ─────────────────────────────────────────────────────────

/** Full-viewport page loader */
export function PageLoader({ text = 'Cargando...' }: { text?: string }) {
  return <Loader variant="spinner" size="lg" text={text} fullScreen />;
}

/** Section / card / table content loader */
export function SectionLoader({
  text = 'Cargando...',
  size = 'md',
}: {
  text?: string;
  size?: Size;
}) {
  return <Loader variant="spinner" size={size} text={text} fill />;
}

/** Tiny inline loader (e.g. inside buttons) */
export function InlineLoader({ text }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader variant="dots" size="xs" />
      {text && <span className="text-sm text-gray-500">{text}</span>}
    </span>
  );
}

// ─── Skeleton helpers ──────────────────────────────────────────────────────────

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <span
      className={cn('block rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse', className)}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3',
        className
      )}
    >
      <SkeletonLine className="h-4 w-2/5" />
      <SkeletonLine className="h-3 w-full" />
      <SkeletonLine className="h-3 w-3/4" />
    </div>
  );
}

export default Loader;
