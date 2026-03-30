export type TestimonialsVariant = 'cards' | 'minimal' | 'featured';

export interface TestimonialItem {
  name: string;
  role: string;
  text: string;
  rating: number; // 1–5
  avatar: string;
}

export interface TestimonialsSectionProps {
  variant: TestimonialsVariant;
  title: string;
  subtitle: string;
  items: TestimonialItem[];
  visible: boolean;
}

export const TESTIMONIALS_DEFAULTS: TestimonialsSectionProps = {
  variant: 'cards',
  title: 'Lo que dicen nuestros clientes',
  subtitle: '',
  items: [
    {
      name: 'Ana García',
      role: 'Cliente',
      text: 'Excelente servicio y productos de primera calidad.',
      rating: 5,
      avatar: '',
    },
    {
      name: 'Carlos López',
      role: 'Cliente',
      text: 'Muy satisfecho con mi compra, lo recomiendo ampliamente.',
      rating: 5,
      avatar: '',
    },
    {
      name: 'María Rodríguez',
      role: 'Cliente',
      text: 'Atención personalizada y entrega rápida.',
      rating: 4,
      avatar: '',
    },
  ],
  visible: true,
};
