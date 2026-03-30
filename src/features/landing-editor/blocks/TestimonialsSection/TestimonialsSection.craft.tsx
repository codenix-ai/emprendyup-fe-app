'use client';
import { useNode, type UserComponent } from '@craftjs/core';
import { TestimonialsSectionSettings } from './TestimonialsSection.settings';
import { TESTIMONIALS_DEFAULTS, type TestimonialsSectionProps } from './TestimonialsSection.props';

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(n)}
      {'☆'.repeat(5 - n)}
    </span>
  );
}

export const TestimonialsSection: UserComponent<TestimonialsSectionProps> = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  return (
    <section
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-block-type="TestimonialsSection"
      className="w-full cursor-move py-16 px-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-10"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
        >
          {props.title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {props.items.map((item, i) => (
            <div
              key={i}
              className="p-6 flex flex-col gap-3"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius)',
              }}
            >
              <Stars n={item.rating} />
              <p
                className="text-sm leading-relaxed italic"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
              >
                &ldquo;{item.text}&rdquo;
              </p>
              <div className="mt-auto">
                <p
                  className="font-semibold text-sm"
                  style={{ color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
                >
                  {item.name}
                </p>
                {item.role && (
                  <p
                    className="text-xs"
                    style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    {item.role}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

TestimonialsSection.craft = {
  displayName: 'Testimonios',
  props: TESTIMONIALS_DEFAULTS,
  related: { settings: TestimonialsSectionSettings },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
