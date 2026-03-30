export type BrandVariant = 'horizontal' | 'stacked' | 'minimal';

export interface BrandSectionProps {
  variant: BrandVariant;
  logoUrl: string;
  name: string;
  tagline: string;
  description: string;
  socialFacebook: string;
  socialInstagram: string;
  socialWhatsapp: string;
  visible: boolean;
}

export const BRAND_SECTION_DEFAULTS: BrandSectionProps = {
  variant: 'stacked',
  logoUrl: '',
  name: 'Mi Negocio',
  tagline: 'Tu mejor opción',
  description: '',
  socialFacebook: '',
  socialInstagram: '',
  socialWhatsapp: '',
  visible: true,
};
