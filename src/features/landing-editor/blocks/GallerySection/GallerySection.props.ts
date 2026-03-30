export type GalleryVariant = 'grid' | 'masonry' | 'slider';

export interface GalleryImage {
  url: string;
  alt: string;
}

export interface GallerySectionProps {
  variant: GalleryVariant;
  title: string;
  columns: 2 | 3 | 4;
  images: GalleryImage[];
  visible: boolean;
}

export const GALLERY_DEFAULTS: GallerySectionProps = {
  variant: 'grid',
  title: 'Galería',
  columns: 3,
  images: [
    { url: '', alt: 'Imagen 1' },
    { url: '', alt: 'Imagen 2' },
    { url: '', alt: 'Imagen 3' },
  ],
  visible: true,
};
