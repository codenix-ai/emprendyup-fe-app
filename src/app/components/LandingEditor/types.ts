// ─── Landing Page Editor Types ────────────────────────────────────────────────
// Types map 1-to-1 with the flat draftConfig returned by the `pages` query.

// ── Shared primitives ─────────────────────────────────────────────────────────

export interface TextStyle {
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: string;
  textAlign?: string;
  letterSpacing?: string;
  lineHeight?: string;
  [key: string]: unknown;
}

export interface ButtonConfig {
  text?: string;
  link?: string;
  href?: string;
  variant?: string;
  style?: Record<string, string>;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: string;
  borderRadius?: string;
  padding?: string;
  [key: string]: unknown;
}

export interface ImageRef {
  id?: string;
  url?: string;
  alt?: string;
  [key: string]: unknown;
}

// ── Section-specific configs ──────────────────────────────────────────────────

export interface DraftSeoConfig {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string[];
  [key: string]: unknown;
}

export interface DraftHeroConfig {
  title?: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: ImageRef | string;
  backgroundColor?: string;
  buttons?: ButtonConfig[];
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  overlayOpacity?: number;
  alignment?: 'left' | 'center' | 'right';
  contentPosition?: 'left' | 'center' | 'right';
  contentVertical?: 'top' | 'center' | 'bottom';
  enabled?: boolean;
  [key: string]: unknown;
}

export interface DraftMenuConfig {
  title?: string;
  items?: Array<Record<string, unknown>>;
  buttons?: ButtonConfig[];
  style?: Record<string, string>;
  [key: string]: unknown;
}

export interface DraftAboutConfig {
  title?: string;
  description?: string;
  paragraphs?: string[];
  stats?: Array<{ label: string; value: string }>;
  images?: ImageRef[];
  style?: Record<string, string>;
  [key: string]: unknown;
}

export interface DraftThemeConfig {
  fonts?: Record<string, string>;
  colors?: Record<string, string>;
  [key: string]: unknown;
}

export interface DraftFooterConfig {
  text?: string;
  links?: Array<{ label: string; url: string }>;
  social?: Record<string, string>;
  [key: string]: unknown;
}

export interface DraftContactConfig {
  title?: string;
  email?: string;
  phone?: string;
  address?: string;
  hours?: Record<string, string>;
  social?: Record<string, string>;
  buttons?: ButtonConfig[];
  [key: string]: unknown;
}

export interface DraftGalleryConfig {
  title?: string;
  images?: ImageRef[];
  columns?: number;
  [key: string]: unknown;
}

export interface DraftBrandingConfig {
  logo?: string | ImageRef;
  name?: string;
  tagline?: string;
  [key: string]: unknown;
}

export interface DraftNavigationConfig {
  items?: Array<{ label: string; link: string }>;
  style?: Record<string, string>;
  [key: string]: unknown;
}

export interface DraftTestimonialsConfig {
  title?: string;
  items?: Array<{ name: string; text: string; rating?: number; avatar?: string }>;
  [key: string]: unknown;
}

export interface DraftReservationFormConfig {
  title?: string;
  fields?: Array<{ name: string; type: string; required?: boolean }>;
  [key: string]: unknown;
}

// ── Aggregate DraftConfig ─────────────────────────────────────────────────────

export interface DraftConfig {
  seo?: DraftSeoConfig;
  hero?: DraftHeroConfig;
  menu?: DraftMenuConfig;
  about?: DraftAboutConfig;
  theme?: DraftThemeConfig;
  footer?: DraftFooterConfig;
  contact?: DraftContactConfig;
  gallery?: DraftGalleryConfig;
  branding?: DraftBrandingConfig;
  navigation?: DraftNavigationConfig;
  testimonials?: DraftTestimonialsConfig;
  reservationForm?: DraftReservationFormConfig;
  [key: string]: unknown;
}

export type DraftSectionKey = keyof DraftConfig & string;

// ── Section metadata (labels + icons for the side nav) ────────────────────────

export const DRAFT_SECTION_META: Record<string, { label: string; icon: string }> = {
  seo: { label: 'SEO', icon: '🔍' },
  hero: { label: 'Hero Banner', icon: '🖼️' },
  menu: { label: 'Productos', icon: '📦' },
  about: { label: 'Sobre Nosotros', icon: '📖' },
  theme: { label: 'Tema', icon: '🎨' },
  footer: { label: 'Footer', icon: '📋' },
  contact: { label: 'Contacto', icon: '📬' },
  gallery: { label: 'Galería', icon: '📷' },
  branding: { label: 'Marca', icon: '🏷️' },
  navigation: { label: 'Navegación', icon: '🧭' },
  testimonials: { label: 'Testimonios', icon: '💬' },
  reservationForm: { label: 'Formulario de Reserva', icon: '📝' },
};

// ── BrandColors (derived from theme.colors for the color picker) ──────────────

export interface BrandColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  buttonColor: string;
  textColor: string;
}

export const DEFAULT_BRAND_COLORS: BrandColors = {
  primaryColor: '#BFA26A',
  secondaryColor: '#1A1512',
  accentColor: '#D4AF6A',
  backgroundColor: '#FAF9F6',
  buttonColor: '#BFA26A',
  textColor: '#1A1512',
};

export function extractColors(config: DraftConfig): BrandColors {
  const c = (config.theme?.colors ?? {}) as Record<string, string>;
  return {
    primaryColor: c.primaryColor ?? DEFAULT_BRAND_COLORS.primaryColor,
    secondaryColor: c.secondaryColor ?? DEFAULT_BRAND_COLORS.secondaryColor,
    accentColor: c.accentColor ?? DEFAULT_BRAND_COLORS.accentColor,
    backgroundColor: c.backgroundColor ?? DEFAULT_BRAND_COLORS.backgroundColor,
    buttonColor: c.buttonColor ?? DEFAULT_BRAND_COLORS.buttonColor,
    textColor: c.textColor ?? DEFAULT_BRAND_COLORS.textColor,
  };
}

// ── PageRecord (from the pages query) ─────────────────────────────────────────

export interface PageRecord {
  id: string;
  storeId?: string;
  restaurantId?: string;
  serviceProviderId?: string;
  status: 'draft' | 'published';
  publishedConfig: DraftConfig | null;
  draftConfig: DraftConfig | null;
  updatedAt: string;
  createdAt: string;
}

// ── Default empty config ──────────────────────────────────────────────────────

export function createDefaultDraftConfig(): DraftConfig {
  return {
    seo: { title: '', description: '' },
    hero: {
      title: 'Bienvenido a nuestra tienda',
      subtitle: 'Descubre productos únicos con la mejor calidad',
      buttons: [{ text: 'Ver productos', link: '/productos' }],
      alignment: 'center',
    },
    menu: { title: 'Productos', items: [] },
    about: { title: 'Sobre nosotros', description: '' },
    theme: { colors: { ...DEFAULT_BRAND_COLORS } },
    footer: { text: '' },
    contact: { title: 'Contacto', email: '', phone: '' },
    gallery: { title: 'Galería', images: [] },
    branding: { name: '', logo: '' },
    navigation: { items: [] },
    testimonials: { title: 'Testimonios', items: [] },
    reservationForm: { title: 'Reservar', fields: [] },
  };
}
