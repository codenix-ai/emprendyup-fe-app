// ─── Landing Page JSON Schema v2.0 ────────────────────────────────────────────
// Contrato de datos compartido entre el editor (Craft.js) y el renderer público.
// NO modificar sin actualizar también el migrador migrateV1toV2.

export interface LandingPageJSON {
  version: '2.0';
  tenantId: string;
  tenantSlug: string;
  status: 'draft' | 'published';
  updatedAt: string;
  publishedAt?: string;

  seo: LandingSEO;
  theme: LandingTheme;

  /** Estado interno de Craft.js — opaco para el renderer, no modificar directamente */
  craftState: CraftSerializedNodes;

  /** Metadata legible extraída del craftState para el renderer público (sin Craft.js) */
  blocks: LandingBlock[];
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

export interface LandingSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export interface LandingTheme {
  preset: ThemePreset;
  colors: LandingThemeColors;
  typography: LandingTypography;
  spacing: 'compact' | 'normal' | 'relaxed';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadows: 'none' | 'subtle' | 'medium' | 'strong';
}

export interface LandingThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export interface LandingTypography {
  headingFont: string; // Google Font name, e.g. "Playfair Display"
  bodyFont: string; // Google Font name, e.g. "Inter"
  scale: 'sm' | 'md' | 'lg' | 'xl';
}

export type ThemePreset =
  | 'elegant-dark'
  | 'modern-light'
  | 'natural-earth'
  | 'bold-vibrant'
  | 'minimal-mono'
  | 'custom';

// ─── Blocks ───────────────────────────────────────────────────────────────────

export interface LandingBlock {
  id: string;
  type: BlockType;
  variant: string;
  visible: boolean;
  order: number;
  props: Record<string, unknown>;
}

export type BlockType =
  | 'HeroBanner'
  | 'ProductGrid'
  | 'AboutSection'
  | 'TestimonialsSection'
  | 'ContactSection'
  | 'GallerySection'
  | 'NavigationBar'
  | 'FooterSection'
  | 'CTABanner'
  | 'BookingForm'
  | 'BrandSection'
  | 'CustomHTML'; // escape hatch para power users

// ─── Craft.js internal state ──────────────────────────────────────────────────
// Opaque para el renderer — es exactamente lo que devuelve query.serialize().

export type CraftSerializedNodes = Record<string, CraftSerializedNode>;

export interface CraftSerializedNode {
  type: { resolvedName: string };
  props: Record<string, unknown>;
  parent?: string;
  nodes: string[];
  linkedNodes: Record<string, string>;
  displayName: string;
  custom: Record<string, unknown>;
  hidden: boolean;
  isCanvas: boolean;
}

// ─── GraphQL mutation input ───────────────────────────────────────────────────
// Matches backend SavePageInput class exactly.
// Exactly one of storeId / restaurantId / serviceProviderId must be provided.
// Exactly one of draftConfig / publishedConfig must be provided per call.

export interface SavePageInput {
  /** Public slug of the tenant (e.g. "mi-tienda") */
  slug: string;
  storeId?: string;
  restaurantId?: string;
  serviceProviderId?: string;
  /** Full page JSON — set when saving a draft */
  draftConfig?: LandingPageJSON;
  /** Full page JSON — set when publishing */
  publishedConfig?: LandingPageJSON;
}

// ─── V1 → V2 migrator (compatibilidad hacia atrás) ────────────────────────────

import type { DraftConfig } from '@/app/components/LandingEditor/types';

export function migrateV1toV2(
  old: DraftConfig,
  tenantId: string,
  tenantSlug: string
): LandingPageJSON {
  const blocks: LandingBlock[] = [];
  let order = 0;

  if (old.hero) {
    blocks.push({
      id: `hero-${Date.now()}`,
      type: 'HeroBanner',
      variant: 'gradient-overlay',
      visible: old.hero.enabled !== false,
      order: order++,
      props: old.hero as Record<string, unknown>,
    });
  }
  if (old.navigation) {
    blocks.push({
      id: `nav-${Date.now()}`,
      type: 'NavigationBar',
      variant: 'default',
      visible: true,
      order: order++,
      props: old.navigation as Record<string, unknown>,
    });
  }
  if (old.menu) {
    blocks.push({
      id: `products-${Date.now()}`,
      type: 'ProductGrid',
      variant: 'grid-3',
      visible: true,
      order: order++,
      props: old.menu as Record<string, unknown>,
    });
  }
  if (old.about) {
    blocks.push({
      id: `about-${Date.now()}`,
      type: 'AboutSection',
      variant: 'default',
      visible: true,
      order: order++,
      props: old.about as Record<string, unknown>,
    });
  }
  if (old.gallery) {
    blocks.push({
      id: `gallery-${Date.now()}`,
      type: 'GallerySection',
      variant: 'masonry',
      visible: true,
      order: order++,
      props: old.gallery as Record<string, unknown>,
    });
  }
  if (old.testimonials) {
    blocks.push({
      id: `testimonials-${Date.now()}`,
      type: 'TestimonialsSection',
      variant: 'cards',
      visible: true,
      order: order++,
      props: old.testimonials as Record<string, unknown>,
    });
  }
  if (old.contact) {
    blocks.push({
      id: `contact-${Date.now()}`,
      type: 'ContactSection',
      variant: 'default',
      visible: true,
      order: order++,
      props: old.contact as Record<string, unknown>,
    });
  }
  if (old.footer) {
    blocks.push({
      id: `footer-${Date.now()}`,
      type: 'FooterSection',
      variant: 'default',
      visible: true,
      order: order++,
      props: old.footer as Record<string, unknown>,
    });
  }

  const oldColors = (old.theme?.colors ?? {}) as Record<string, string>;

  return {
    version: '2.0',
    tenantId,
    tenantSlug,
    status: 'draft',
    updatedAt: new Date().toISOString(),
    seo: {
      title: old.seo?.title ?? '',
      description: old.seo?.description ?? '',
      keywords: old.seo?.keywords ?? [],
      ogImage: old.seo?.ogImage,
    },
    theme: {
      preset: 'custom',
      colors: {
        primary: oldColors.primaryColor ?? '#BFA26A',
        secondary: oldColors.secondaryColor ?? '#1A1512',
        accent: oldColors.accentColor ?? '#D4AF6A',
        background: oldColors.backgroundColor ?? '#FAF9F6',
        surface: oldColors.surface ?? '#F0EBE3',
        text: oldColors.textColor ?? '#1A1512',
        textMuted: oldColors.textMuted ?? '#6B5E4E',
      },
      typography: {
        headingFont: old.theme?.fonts?.heading ?? 'Inter',
        bodyFont: old.theme?.fonts?.body ?? 'Inter',
        scale: 'md',
      },
      spacing: 'normal',
      borderRadius: 'md',
      shadows: 'subtle',
    },
    craftState: {} as CraftSerializedNodes, // se poblará al deserializar en Craft.js
    blocks,
  };
}
