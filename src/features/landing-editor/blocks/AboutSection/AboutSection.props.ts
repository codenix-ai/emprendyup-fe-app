export type AboutVariant =
  | 'default'
  | 'timeline'
  | 'team'
  | 'side-by-side'
  | 'centered'
  | 'with-stats';

export const ABOUT_SECTION_VARIANTS: Record<'default' | 'timeline' | 'team', string> = {
  default: 'Estándar',
  timeline: 'Línea de tiempo',
  team: 'Equipo',
};

export interface AboutStat {
  label: string;
  value: string;
}

export interface AboutSectionProps {
  variant: AboutVariant;
  title: string;
  description: string;
  image: string;
  stats: AboutStat[];
  visible: boolean;
}

export const ABOUT_SECTION_DEFAULTS: AboutSectionProps = {
  variant: 'default',
  title: 'Sobre Nosotros',
  description:
    'Somos una empresa comprometida con la calidad y la satisfacción de nuestros clientes.',
  image: '',
  stats: [
    { label: 'Años de experiencia', value: '5+' },
    { label: 'Clientes satisfechos', value: '1,000+' },
    { label: 'Productos', value: '200+' },
  ],
  visible: true,
};
