'use client';
import { useNode, type UserComponent } from '@craftjs/core';
import { GallerySectionSettings } from './GallerySection.settings';
import { GALLERY_DEFAULTS, type GallerySectionProps } from './GallerySection.props';

export const GallerySection: UserComponent<GallerySectionProps> = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const colsClass =
    props.columns === 2
      ? 'grid-cols-2'
      : props.columns === 4
        ? 'grid-cols-2 sm:grid-cols-4'
        : 'grid-cols-2 sm:grid-cols-3';
  return (
    <section
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-block-type="GallerySection"
      className="w-full cursor-move py-16 px-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="max-w-5xl mx-auto">
        {props.title && (
          <h2
            className="text-3xl font-bold text-center mb-10"
            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
          >
            {props.title}
          </h2>
        )}
        <div className={`grid ${colsClass} gap-3`}>
          {props.images.map((img, i) =>
            img.url ? (
              <img
                key={i}
                src={img.url}
                alt={img.alt}
                className="w-full aspect-square object-cover"
                style={{ borderRadius: 'var(--radius)' }}
              />
            ) : (
              <div
                key={i}
                className="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-400 text-xs"
                style={{ borderRadius: 'var(--radius)' }}
              >
                Sin imagen
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
};

GallerySection.craft = {
  displayName: 'Galería',
  props: GALLERY_DEFAULTS,
  related: { settings: GallerySectionSettings },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
