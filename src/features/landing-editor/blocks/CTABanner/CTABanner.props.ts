export type CTAVariant = 'gradient' | 'boxed' | 'minimal';

export interface CTABannerProps {
  variant: CTAVariant;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  ctaVariant: 'primary' | 'secondary' | 'outline';
  backgroundColor: string;
  textColor: string;
  visible: boolean;
}

export const CTA_BANNER_DEFAULTS: CTABannerProps = {
  variant: 'gradient',
  title: '¿Listo para empezar?',
  subtitle: 'Únete a miles de clientes satisfechos',
  ctaText: 'Comenzar ahora',
  ctaHref: '/productos',
  ctaVariant: 'primary',
  backgroundColor: '#4F46E5',
  textColor: '#FFFFFF',
  visible: true,
};
