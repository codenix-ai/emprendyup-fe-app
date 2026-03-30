'use client';

// ─── HeroBanner Craft.js Component ───────────────────────────────────────────
// Wrapper del bloque HeroBanner para el editor.
// useNode() inyecta los refs de drag & drop de Craft.js.

import { useNode, type UserComponent } from '@craftjs/core';
import { HeroBannerSettings } from './HeroBanner.settings';
import { HERO_BANNER_DEFAULTS, type HeroBannerProps } from './HeroBanner.props';

// ─── Variant implementations ──────────────────────────────────────────────────

function GradientOverlay(props: HeroBannerProps) {
  const align =
    props.contentPosition === 'left'
      ? 'items-start text-left'
      : props.contentPosition === 'right'
        ? 'items-end text-right'
        : 'items-center text-center';

  return (
    <div
      className={`relative flex flex-col justify-center ${align} px-8 py-16`}
      style={{
        minHeight: props.minHeight,
        backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: props.backgroundImage ? undefined : 'var(--color-bg)',
      }}
    >
      {/* Overlay — user-specified color & opacity, intentionally kept as-is */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: props.overlayColor,
          opacity: props.overlayOpacity,
        }}
      />
      {/* Content — text on dark overlay stays white for contrast */}
      <div className="relative z-10 max-w-3xl">
        <h1
          className="text-4xl md:text-6xl font-bold leading-tight text-white"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {props.title}
        </h1>
        <p
          className="mt-4 text-lg md:text-xl text-gray-200"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {props.subtitle}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {props.cta.map((btn, i) => (
            <a
              key={i}
              href={btn.href}
              className="px-6 py-3 font-semibold transition"
              style={
                btn.variant === 'primary'
                  ? {
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      borderRadius: 'var(--radius)',
                    }
                  : btn.variant === 'outline'
                    ? {
                        border: '2px solid #fff',
                        color: '#fff',
                        borderRadius: 'var(--radius)',
                      }
                    : {
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        borderRadius: 'var(--radius)',
                      }
              }
            >
              {btn.text}
            </a>
          ))}
        </div>
        {props.showColumns && props.columnItems.length > 0 && (
          <div
            className="mt-10 grid gap-6"
            style={{ gridTemplateColumns: `repeat(${props.columns}, 1fr)` }}
          >
            {props.columnItems.map((col, i) => (
              <div key={i} className="text-left">
                <p className="font-semibold text-white">{col.title}</p>
                <p className="text-sm text-gray-300 mt-1">{col.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SplitImage(props: HeroBannerProps) {
  return (
    <div className="flex flex-col md:flex-row" style={{ minHeight: props.minHeight }}>
      <div
        className="flex-1 flex flex-col justify-center px-8 py-16"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <h1
          className="text-4xl font-bold"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
        >
          {props.title}
        </h1>
        <p
          className="mt-4"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
        >
          {props.subtitle}
        </p>
        <div className="mt-6 flex gap-3 flex-wrap">
          {props.cta.map((btn, i) => (
            <a
              key={i}
              href={btn.href}
              className="px-5 py-2 font-medium"
              style={
                btn.variant === 'outline'
                  ? {
                      border: '2px solid var(--color-primary)',
                      color: 'var(--color-primary)',
                      borderRadius: 'var(--radius)',
                    }
                  : btn.variant === 'secondary'
                    ? {
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        borderRadius: 'var(--radius)',
                      }
                    : {
                        backgroundColor: 'var(--color-primary)',
                        color: '#fff',
                        borderRadius: 'var(--radius)',
                      }
              }
            >
              {btn.text}
            </a>
          ))}
        </div>
        {props.showColumns && props.columnItems.length > 0 && (
          <div
            className="mt-8 grid gap-4"
            style={{ gridTemplateColumns: `repeat(${props.columns}, 1fr)` }}
          >
            {props.columnItems.map((col, i) => (
              <div key={i}>
                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  {col.title}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {col.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        className="flex-1"
        style={{
          backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: props.backgroundImage ? undefined : 'var(--color-surface)',
          minHeight: '300px',
        }}
      />
    </div>
  );
}

function Minimal(props: HeroBannerProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-8 py-24"
      style={{ minHeight: props.minHeight, backgroundColor: 'var(--color-bg)' }}
    >
      <h1
        className="text-5xl font-bold"
        style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
      >
        {props.title}
      </h1>
      <p
        className="mt-4 text-xl max-w-2xl"
        style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
      >
        {props.subtitle}
      </p>
      <div className="mt-8 flex gap-4 flex-wrap justify-center">
        {props.cta.map((btn, i) => (
          <a
            key={i}
            href={btn.href}
            className="px-6 py-3 font-medium"
            style={
              btn.variant === 'outline'
                ? {
                    border: '2px solid var(--color-primary)',
                    color: 'var(--color-primary)',
                    borderRadius: 'var(--radius)',
                  }
                : btn.variant === 'secondary'
                  ? {
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      borderRadius: 'var(--radius)',
                    }
                  : {
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      borderRadius: 'var(--radius)',
                    }
            }
          >
            {btn.text}
          </a>
        ))}
      </div>
      {props.showColumns && props.columnItems.length > 0 && (
        <div
          className="mt-10 grid gap-6 w-full max-w-3xl"
          style={{ gridTemplateColumns: `repeat(${props.columns}, 1fr)` }}
        >
          {props.columnItems.map((col, i) => (
            <div key={i} className="text-center">
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {col.title}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {col.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const VARIANTS = {
  'gradient-overlay': GradientOverlay,
  'split-image': SplitImage,
  minimal: Minimal,
} as const;

// ─── Main component ───────────────────────────────────────────────────────────

export const HeroBanner: UserComponent<HeroBannerProps> = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const VariantComponent = VARIANTS[props.variant] ?? GradientOverlay;

  return (
    <section
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-block-type="HeroBanner"
      className="relative w-full cursor-move"
    >
      <VariantComponent {...props} />
    </section>
  );
};

HeroBanner.craft = {
  displayName: 'Hero Banner',
  props: HERO_BANNER_DEFAULTS,
  related: {
    settings: HeroBannerSettings,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
