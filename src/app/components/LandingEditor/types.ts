// ─── Landing Page Editor Types ────────────────────────────────────────────────

export type SectionType = 'hero' | 'features' | 'gallery' | 'testimonials' | 'cta' | 'contact';

export interface HeroSectionData {
  title: string;
  subtitle: string;
  backgroundImage: string;
  overlayOpacity: number;
  ctaText: string;
  ctaLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  alignment: 'left' | 'center' | 'right';
}

export interface FeatureItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface FeaturesSectionData {
  title: string;
  subtitle: string;
  items: FeatureItem[];
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
}

export interface GallerySectionData {
  title: string;
  images: GalleryImage[];
  columns: 2 | 3 | 4;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  text: string;
  rating: number;
}

export interface TestimonialsSectionData {
  title: string;
  items: Testimonial[];
}

export interface CtaSectionData {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  backgroundStyle: 'primary' | 'dark' | 'light';
}

export interface ContactSectionData {
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
  showMap: boolean;
}

export type SectionData =
  | HeroSectionData
  | FeaturesSectionData
  | GallerySectionData
  | TestimonialsSectionData
  | CtaSectionData
  | ContactSectionData;

export interface PageSection {
  id: string;
  type: SectionType;
  enabled: boolean;
  data: SectionData;
}

export interface BrandColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  buttonColor: string;
  textColor: string;
}

export interface LandingPageConfig {
  colors: BrandColors;
  logoUrl: string;
  businessName: string;
  sections: PageSection[];
}

export interface PageRecord {
  id: string;
  storeId?: string;
  restaurantId?: string;
  serviceProviderId?: string;
  status: 'draft' | 'published';
  publishedConfig: LandingPageConfig | null;
  draftConfig: LandingPageConfig | null;
  updatedAt: string;
  createdAt: string;
}

export const DEFAULT_HERO_DATA: HeroSectionData = {
  title: 'Bienvenido a nuestra tienda',
  subtitle: 'Descubre productos únicos con la mejor calidad',
  backgroundImage: '',
  overlayOpacity: 0.4,
  ctaText: 'Ver productos',
  ctaLink: '/productos',
  ctaSecondaryText: 'Contáctanos',
  ctaSecondaryLink: '/contacto',
  alignment: 'center',
};

export const DEFAULT_FEATURES_DATA: FeaturesSectionData = {
  title: 'Por qué elegirnos',
  subtitle: 'Razones para confiar en nosotros',
  items: [
    { id: '1', icon: '🚀', title: 'Envío rápido', description: 'Entregas en 24-48 horas' },
    { id: '2', icon: '✨', title: 'Calidad garantizada', description: 'Productos verificados' },
    { id: '3', icon: '💬', title: 'Soporte 24/7', description: 'Siempre disponibles para ti' },
  ],
};

export const DEFAULT_CTA_DATA: CtaSectionData = {
  title: '¿Listo para empezar?',
  subtitle: 'Únete a miles de clientes satisfechos',
  buttonText: 'Comenzar ahora',
  buttonLink: '/productos',
  backgroundStyle: 'primary',
};

export function createDefaultConfig(partial: Partial<LandingPageConfig> = {}): LandingPageConfig {
  return {
    colors: {
      primaryColor: '#BFA26A',
      secondaryColor: '#1A1512',
      accentColor: '#D4AF6A',
      backgroundColor: '#FAF9F6',
      buttonColor: '#BFA26A',
      textColor: '#1A1512',
    },
    logoUrl: '',
    businessName: '',
    sections: [
      { id: 'hero-1', type: 'hero', enabled: true, data: { ...DEFAULT_HERO_DATA } },
      { id: 'features-1', type: 'features', enabled: true, data: { ...DEFAULT_FEATURES_DATA } },
      { id: 'cta-1', type: 'cta', enabled: true, data: { ...DEFAULT_CTA_DATA } },
    ],
    ...partial,
  };
}
