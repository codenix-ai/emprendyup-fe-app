'use client';
import { useNode, type UserComponent } from '@craftjs/core';
import { CTABannerSettings } from './CTABanner.settings';
import { CTA_BANNER_DEFAULTS, type CTABannerProps } from './CTABanner.props';

export const CTABanner: UserComponent<CTABannerProps> = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const isGradient = props.variant === 'gradient';
  return (
    <section
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-block-type="CTABanner"
      className="w-full cursor-move py-16 px-6"
      style={{
        background: isGradient
          ? `linear-gradient(135deg, ${props.backgroundColor}, ${props.backgroundColor}cc)`
          : props.backgroundColor,
      }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2
          className="text-3xl font-bold"
          style={{ color: props.textColor, fontFamily: 'var(--font-heading)' }}
        >
          {props.title}
        </h2>
        {props.subtitle && (
          <p
            className="mt-3 text-lg opacity-80"
            style={{ color: props.textColor, fontFamily: 'var(--font-body)' }}
          >
            {props.subtitle}
          </p>
        )}
        <a
          href={props.ctaHref}
          className="mt-8 inline-block px-8 py-3 font-semibold text-sm transition hover:opacity-90"
          style={
            props.ctaVariant === 'outline'
              ? {
                  border: `2px solid ${props.textColor}`,
                  color: props.textColor,
                  borderRadius: 'var(--radius)',
                }
              : {
                  background: props.textColor,
                  color: props.backgroundColor,
                  borderRadius: 'var(--radius)',
                }
          }
        >
          {props.ctaText}
        </a>
      </div>
    </section>
  );
};

CTABanner.craft = {
  displayName: 'Banner CTA',
  props: CTA_BANNER_DEFAULTS,
  related: { settings: CTABannerSettings },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
