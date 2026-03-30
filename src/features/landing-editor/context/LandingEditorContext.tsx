'use client';

// ─── LandingEditorContext ──────────────────────────────────────────────────────
// Contexto React que centraliza el estado mutable del editor:
//   - tenant (inmutable durante la sesión)
//   - seo (editable desde SEO settings)
//   - theme (editable desde ThemeSelector, FASE 2)
//
// Provisto por EditorRoot, consumido por EditorToolbar, PropertiesPanel, etc.

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { TenantContext } from './TenantContext';
import type { LandingSEO, LandingTheme } from '@/lib/landing-renderer/types/landing-json.schema';

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SEO: LandingSEO = {
  title: '',
  description: '',
  keywords: [],
};

export const DEFAULT_THEME: LandingTheme = {
  preset: 'modern-light',
  colors: {
    primary: '#BFA26A',
    secondary: '#1A1512',
    accent: '#D4AF6A',
    background: '#FAF9F6',
    surface: '#F0EBE3',
    text: '#1A1512',
    textMuted: '#6B5E4E',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    scale: 'md',
  },
  spacing: 'normal',
  borderRadius: 'md',
  shadows: 'subtle',
};

// ─── Context shape ────────────────────────────────────────────────────────────

interface LandingEditorContextValue {
  tenant: TenantContext;
  seo: LandingSEO;
  setSeo: (seo: LandingSEO) => void;
  theme: LandingTheme;
  setTheme: (theme: LandingTheme) => void;
  /** Viewport activo en el canvas: desktop (full-width) | mobile (375px) */
  viewport: 'desktop' | 'mobile';
  setViewport: (v: 'desktop' | 'mobile') => void;
}

const LandingEditorContext = createContext<LandingEditorContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface LandingEditorProviderProps {
  tenant: TenantContext;
  initialSeo?: LandingSEO;
  initialTheme?: LandingTheme;
  children: ReactNode;
}

export function LandingEditorProvider({
  tenant,
  initialSeo = DEFAULT_SEO,
  initialTheme = DEFAULT_THEME,
  children,
}: LandingEditorProviderProps) {
  const [seo, setSeo] = useState<LandingSEO>(initialSeo);
  const [theme, setTheme] = useState<LandingTheme>(initialTheme);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <LandingEditorContext.Provider
      value={{ tenant, seo, setSeo, theme, setTheme, viewport, setViewport }}
    >
      {children}
    </LandingEditorContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLandingEditor(): LandingEditorContextValue {
  const ctx = useContext(LandingEditorContext);
  if (!ctx) {
    throw new Error('useLandingEditor must be used inside <LandingEditorProvider>');
  }
  return ctx;
}
