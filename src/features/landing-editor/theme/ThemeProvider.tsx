'use client';

import React from 'react';
import type { LandingTheme } from '@/lib/landing-renderer/types/landing-json.schema';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RADIUS_MAP: Record<LandingTheme['borderRadius'], string> = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '16px',
  full: '9999px',
};

function buildGoogleFontsUrl(fonts: string[]): string {
  const unique = [...new Set(fonts.filter(Boolean))];
  const families = unique
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface ThemeProviderProps {
  theme: LandingTheme;
  children: React.ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps): React.ReactElement {
  const { colors, typography, borderRadius } = theme;

  const cssVars: React.CSSProperties & Record<string, string> = {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
    '--color-bg': colors.background,
    '--color-surface': colors.surface,
    '--color-text': colors.text,
    '--color-text-muted': colors.textMuted,
    '--font-heading': `'${typography.headingFont}', sans-serif`,
    '--font-body': `'${typography.bodyFont}', sans-serif`,
    '--radius': RADIUS_MAP[borderRadius],
  };

  const fontsUrl = buildGoogleFontsUrl([typography.headingFont, typography.bodyFont]);

  return (
    <>
      {/* Scoped Google Fonts import — only loads the fonts needed by this theme */}
      <style>{`@import url('${fontsUrl}');`}</style>

      <div style={cssVars} className="contents">
        {children}
      </div>
    </>
  );
}
