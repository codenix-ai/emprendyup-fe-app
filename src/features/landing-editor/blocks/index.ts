// ─── Block Registry ────────────────────────────────────────────────────────────
// Mapa de todos los componentes Craft.js disponibles en el editor.
// Se pasa directamente al prop `resolver` de <Editor resolver={BLOCK_REGISTRY}>.

import type { Resolver } from '@craftjs/core';

// ── Craft components ──────────────────────────────────────────────────────────
import { HeroBanner } from './HeroBanner/HeroBanner.craft';
import { ProductGrid } from './ProductGrid/ProductGrid.craft';
import { AboutSection } from './AboutSection/AboutSection.craft';
import { TestimonialsSection } from './TestimonialsSection/TestimonialsSection.craft';
import { ContactSection } from './ContactSection/ContactSection.craft';
import { GallerySection } from './GallerySection/GallerySection.craft';
import { NavigationBar } from './NavigationBar/NavigationBar.craft';
import { FooterSection } from './FooterSection/FooterSection.craft';
import { CTABanner } from './CTABanner/CTABanner.craft';
import { BookingForm } from './BookingForm/BookingForm.craft';
import { BrandSection } from './BrandSection/BrandSection.craft';

// ── Default props (exported for ToolboxPanel.connectors.create) ───────────────
export { HERO_BANNER_DEFAULTS } from './HeroBanner/HeroBanner.props';
export { PRODUCT_GRID_DEFAULTS } from './ProductGrid/ProductGrid.props';
export { ABOUT_SECTION_DEFAULTS } from './AboutSection/AboutSection.props';
export { CONTACT_SECTION_DEFAULTS } from './ContactSection/ContactSection.props';
export { TESTIMONIALS_DEFAULTS } from './TestimonialsSection/TestimonialsSection.props';
export { GALLERY_DEFAULTS } from './GallerySection/GallerySection.props';
export { NAVIGATION_BAR_DEFAULTS } from './NavigationBar/NavigationBar.props';
export { FOOTER_SECTION_DEFAULTS } from './FooterSection/FooterSection.props';
export { CTA_BANNER_DEFAULTS } from './CTABanner/CTABanner.props';
export { BOOKING_FORM_DEFAULTS } from './BookingForm/BookingForm.props';
export { BRAND_SECTION_DEFAULTS } from './BrandSection/BrandSection.props';

// ── Registry ──────────────────────────────────────────────────────────────────
export const BLOCK_REGISTRY: Resolver = {
  HeroBanner,
  ProductGrid,
  AboutSection,
  TestimonialsSection,
  ContactSection,
  GallerySection,
  NavigationBar,
  FooterSection,
  CTABanner,
  BookingForm,
  BrandSection,
};

// ─── Toolbox metadata ─────────────────────────────────────────────────────────
// Usado por ToolboxPanel para renderizar la biblioteca de bloques arrastrables.

export interface BlockMeta {
  displayName: string;
  icon: string;
  description: string;
  allowedFor: Array<'store' | 'restaurant' | 'serviceProvider'> | 'all';
}

export const BLOCK_META: Record<keyof typeof BLOCK_REGISTRY, BlockMeta> = {
  HeroBanner: {
    displayName: 'Hero Banner',
    icon: '🖼️',
    description: 'Sección principal con imagen de fondo y llamada a la acción.',
    allowedFor: 'all',
  },
  ProductGrid: {
    displayName: 'Grilla de Productos',
    icon: '📦',
    description: 'Muestra tus productos o platos en una cuadrícula.',
    allowedFor: ['store', 'restaurant'],
  },
  AboutSection: {
    displayName: 'Sobre Nosotros',
    icon: '📖',
    description: 'Historia y valores de tu negocio.',
    allowedFor: 'all',
  },
  TestimonialsSection: {
    displayName: 'Testimonios',
    icon: '💬',
    description: 'Reseñas y opiniones de tus clientes.',
    allowedFor: 'all',
  },
  ContactSection: {
    displayName: 'Contacto',
    icon: '📬',
    description: 'Formulario de contacto, teléfono y dirección.',
    allowedFor: 'all',
  },
  GallerySection: {
    displayName: 'Galería',
    icon: '📷',
    description: 'Portafolio de imágenes de tu negocio.',
    allowedFor: 'all',
  },
  NavigationBar: {
    displayName: 'Barra de Navegación',
    icon: '🧭',
    description: 'Menú superior con enlaces y logo.',
    allowedFor: 'all',
  },
  FooterSection: {
    displayName: 'Footer',
    icon: '📋',
    description: 'Pie de página con links y redes sociales.',
    allowedFor: 'all',
  },
  CTABanner: {
    displayName: 'Banner CTA',
    icon: '📣',
    description: 'Banner de llamada a la acción con botón destacado.',
    allowedFor: 'all',
  },
  BookingForm: {
    displayName: 'Formulario de Reserva',
    icon: '📝',
    description: 'Reservas o turnos online.',
    allowedFor: ['restaurant', 'serviceProvider'],
  },
  BrandSection: {
    displayName: 'Marca',
    icon: '🏷️',
    description: 'Logo, tagline y colores de tu marca.',
    allowedFor: 'all',
  },
};
