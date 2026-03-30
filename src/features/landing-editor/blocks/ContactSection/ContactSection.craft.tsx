'use client';
import { useNode, type UserComponent } from '@craftjs/core';
import { ContactSectionSettings } from './ContactSection.settings';
import { CONTACT_SECTION_DEFAULTS, type ContactSectionProps } from './ContactSection.props';

export const ContactSection: UserComponent<ContactSectionProps> = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  return (
    <section
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-block-type="ContactSection"
      className="w-full cursor-move py-16 px-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2
            className="text-3xl font-bold"
            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
          >
            {props.title}
          </h2>
          {props.subtitle && (
            <p
              className="mt-2"
              style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
            >
              {props.subtitle}
            </p>
          )}
        </div>
        <div
          className={props.variant === 'split' ? 'flex gap-10' : 'flex flex-col items-center gap-8'}
        >
          <div
            className="flex flex-col gap-3 text-sm"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
          >
            {props.email && <p>✉ {props.email}</p>}
            {props.phone && <p>📞 {props.phone}</p>}
            {props.address && <p>📍 {props.address}</p>}
          </div>
          {props.showForm && (
            <form
              className="flex flex-col gap-3 w-full max-w-md"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                placeholder="Tu nombre"
                className="border border-gray-300 px-4 py-2 text-sm"
                style={{ borderRadius: 'var(--radius)' }}
              />
              <input
                placeholder="Tu email"
                className="border border-gray-300 px-4 py-2 text-sm"
                style={{ borderRadius: 'var(--radius)' }}
                type="email"
              />
              <textarea
                placeholder="Mensaje"
                className="border border-gray-300 px-4 py-2 text-sm resize-none"
                style={{ borderRadius: 'var(--radius)' }}
                rows={4}
              />
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: 'var(--radius)',
                }}
              >
                {props.submitText}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

ContactSection.craft = {
  displayName: 'Contacto',
  props: CONTACT_SECTION_DEFAULTS,
  related: { settings: ContactSectionSettings },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
