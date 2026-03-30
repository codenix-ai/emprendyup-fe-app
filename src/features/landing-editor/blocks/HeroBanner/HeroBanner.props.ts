// ─── HeroBanner Props ─────────────────────────────────────────────────────────
// Contrato de props para el bloque HeroBanner en el editor y el renderer.
// No tiene "use client" — es solo tipos.

export interface HeroBannerCTA {
  text: string;
  href: string;
  /** "primary" | "secondary" | "outline" */
  variant: 'primary' | 'secondary' | 'outline';
}

export type HeroBannerVariant = 'gradient-overlay' | 'split-image' | 'minimal';

export interface HeroColumnItem {
  title: string;
  text: string;
}

export interface HeroBannerProps {
  variant: HeroBannerVariant;

  // Content
  title: string;
  subtitle: string;
  cta: HeroBannerCTA[];

  // Background
  backgroundImage: string;
  overlayColor: string;
  overlayOpacity: number; // 0–1

  // Layout
  minHeight: string; // e.g. "80vh", "600px"
  contentPosition: 'left' | 'center' | 'right';
  textAlign: 'left' | 'center' | 'right';

  // Column section below the headline
  showColumns: boolean;
  columns: 2 | 3;
  columnItems: HeroColumnItem[];

  // Visibility
  visible: boolean;
}

export const HERO_BANNER_DEFAULTS: HeroBannerProps = {
  variant: 'gradient-overlay',
  title: 'Bienvenido a nuestra tienda',
  subtitle: 'Descubre productos únicos con la mejor calidad',
  cta: [{ text: 'Ver más', href: '/products', variant: 'primary' }],
  backgroundImage: '',
  overlayColor: '#000000',
  overlayOpacity: 0.4,
  minHeight: '80vh',
  contentPosition: 'center',
  textAlign: 'center',
  showColumns: false,
  columns: 3,
  columnItems: [
    { title: 'Envío gratis', text: 'En pedidos mayores a $50' },
    { title: 'Calidad garantizada', text: 'Devolución en 30 días' },
    { title: 'Atención 24/7', text: 'Siempre disponibles para ti' },
  ],
  visible: true,
};
