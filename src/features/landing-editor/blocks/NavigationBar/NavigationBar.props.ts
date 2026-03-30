export type NavVariant = 'minimal' | 'centered' | 'with-cta';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavigationBarProps {
  variant: NavVariant;
  logoText: string;
  logoUrl: string;
  links: NavLink[];
  ctaText: string;
  ctaHref: string;
  showCart: boolean;
  cartHref: string;
  sticky: boolean;
  visible: boolean;
}

export const NAVIGATION_BAR_DEFAULTS: NavigationBarProps = {
  variant: 'minimal',
  logoText: 'Mi Negocio',
  logoUrl: '',
  links: [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/productos' },
    { label: 'Contacto', href: '/contacto' },
  ],
  ctaText: 'Ver catálogo',
  ctaHref: '/productos',
  showCart: true,
  cartHref: '/carrito',
  sticky: true,
  visible: true,
};
