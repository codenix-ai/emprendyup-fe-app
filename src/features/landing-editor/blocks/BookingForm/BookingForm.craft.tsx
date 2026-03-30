'use client';
import { useNode, type UserComponent } from '@craftjs/core';
import { BookingFormSettings } from './BookingForm.settings';
import { BOOKING_FORM_DEFAULTS, type BookingFormProps } from './BookingForm.props';

export const BookingForm: UserComponent<BookingFormProps> = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const isCard = props.variant === 'card';
  return (
    <section
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-block-type="BookingForm"
      className="w-full cursor-move py-16 px-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className={`mx-auto ${isCard ? 'max-w-md p-8 shadow-lg' : 'max-w-2xl'}`}
        style={
          isCard
            ? {
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius)',
              }
            : undefined
        }
      >
        <h2
          className="text-2xl font-bold text-center"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
        >
          {props.title}
        </h2>
        {props.subtitle && (
          <p
            className="text-sm text-center mt-2"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
          >
            {props.subtitle}
          </p>
        )}
        <form className="mt-6 flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          {props.fields.map((field, i) => (
            <label key={i} className="flex flex-col gap-1">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
              >
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </span>
              {field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  className="border border-gray-300 px-3 py-2 text-sm resize-none"
                  style={{ borderRadius: 'var(--radius)' }}
                />
              ) : field.type === 'select' ? (
                <select
                  className="border border-gray-300 px-3 py-2 text-sm"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  {field.options?.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  required={field.required}
                  className="border border-gray-300 px-3 py-2 text-sm"
                  style={{ borderRadius: 'var(--radius)' }}
                />
              )}
            </label>
          ))}
          <button
            type="submit"
            className="py-2.5 font-medium text-sm mt-2"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: 'var(--radius)',
            }}
          >
            {props.submitText}
          </button>
        </form>
      </div>
    </section>
  );
};

BookingForm.craft = {
  displayName: 'Formulario de Reserva',
  props: BOOKING_FORM_DEFAULTS,
  related: { settings: BookingFormSettings },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
