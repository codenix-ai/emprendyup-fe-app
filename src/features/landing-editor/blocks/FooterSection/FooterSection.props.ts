export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterSectionProps {
  companyName: string;
  tagline: string;
  columns: FooterColumn[];
  socialFacebook: string;
  socialInstagram: string;
  socialTiktok: string;
  socialWhatsapp: string;
  showWhatsappFloat: boolean;
  whatsappFloatMessage: string;
  copyrightText: string;
  visible: boolean;
}

export const FOOTER_SECTION_DEFAULTS: FooterSectionProps = {
  companyName: 'Mi Negocio',
  tagline: 'Productos y servicios para ti.',
  columns: [
    {
      title: 'Empresa',
      links: [
        { label: 'Quiénes somos', href: '/nosotros' },
        { label: 'Blog', href: '/blog' },
        { label: 'Trabaja con nosotros', href: '/empleos' },
      ],
    },
    {
      title: 'Productos',
      links: [
        { label: 'Catálogo', href: '/productos' },
        { label: 'Novedades', href: '/novedades' },
        { label: 'Ofertas', href: '/ofertas' },
      ],
    },
    {
      title: 'Ayuda',
      links: [
        { label: 'Contacto', href: '/contacto' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Devoluciones', href: '/devoluciones' },
      ],
    },
  ],
  socialFacebook: '',
  socialInstagram: '',
  socialTiktok: '',
  socialWhatsapp: '',
  showWhatsappFloat: false,
  whatsappFloatMessage: 'Hola, me gustaría más información.',
  copyrightText: `© ${new Date().getFullYear()} Mi Negocio. Todos los derechos reservados.`,
  visible: true,
};
