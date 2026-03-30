'use client';
import { useNode, type UserComponent } from '@craftjs/core';
import { BrandSectionSettings } from './BrandSection.settings';
import { BRAND_SECTION_DEFAULTS, type BrandSectionProps } from './BrandSection.props';

export const BrandSection: UserComponent<BrandSectionProps> = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const isHorizontal = props.variant === 'horizontal';
  return (
    <section
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-block-type="BrandSection"
      className={`w-full cursor-move py-12 px-6 flex ${isHorizontal ? 'flex-row items-center gap-8' : 'flex-col items-center text-center'} justify-center`}
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {props.logoUrl ? (
        <img
          src={props.logoUrl}
          alt={props.name}
          className={`${isHorizontal ? 'h-16' : 'h-20 mb-4'} w-auto object-contain`}
        />
      ) : (
        <div
          className={`bg-gray-200 flex items-center justify-center text-gray-400 text-sm ${isHorizontal ? 'w-16 h-16 shrink-0' : 'w-20 h-20 mb-4'}`}
          style={{ borderRadius: 'var(--radius)' }}
        >
          Logo
        </div>
      )}
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
        >
          {props.name}
        </h2>
        {props.tagline && (
          <p
            className="mt-1"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
          >
            {props.tagline}
          </p>
        )}
        {props.description && (
          <p
            className="text-sm mt-2 max-w-md"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
          >
            {props.description}
          </p>
        )}
        <div className="flex gap-3 mt-4 flex-wrap justify-center">
          {props.socialInstagram && (
            <a
              href={`https://instagram.com/${props.socialInstagram.replace('@', '')}`}
              className="text-xs px-3 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-muted)',
              }}
            >
              Instagram
            </a>
          )}
          {props.socialWhatsapp && (
            <a
              href={`https://wa.me/${props.socialWhatsapp.replace(/\D/g, '')}`}
              className="text-xs px-3 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-muted)',
              }}
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

BrandSection.craft = {
  displayName: 'Sección de Marca',
  props: BRAND_SECTION_DEFAULTS,
  related: { settings: BrandSectionSettings },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
