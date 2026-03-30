export type ProductGridVariant = 'grid' | 'grid-3' | 'grid-4' | 'list' | 'featured';

export const PRODUCT_GRID_VARIANTS: Record<ProductGridVariant, string> = {
  grid: 'Cuadrícula (3 col)',
  'grid-3': 'Cuadrícula (3 col)',
  'grid-4': 'Cuadrícula (4 col)',
  list: 'Slider horizontal',
  featured: 'Destacado',
};

export interface ProductGridProps {
  variant: ProductGridVariant;
  title: string;
  subtitle: string;
  maxItems: number;
  showPrices: boolean;
  showAddToCart: boolean;
  visible: boolean;
}

export const PRODUCT_GRID_DEFAULTS: ProductGridProps = {
  variant: 'grid',
  title: 'Nuestros Productos',
  subtitle: 'Descubre lo que tenemos para ti',
  maxItems: 6,
  showPrices: true,
  showAddToCart: true,
  visible: true,
};
