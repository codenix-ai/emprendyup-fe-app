'use client';
import { useNode } from '@craftjs/core';
import type { BookingFormProps, BookingVariant } from './BookingForm.props';

const VARIANTS: Array<{ value: BookingVariant; label: string }> = [
  { value: 'card', label: 'Tarjeta centrada' },
  { value: 'fullwidth', label: 'Ancho completo' },
];

export function BookingFormSettings() {
  const {
    props,
    actions: { setProp },
  } = useNode<{ props: BookingFormProps }>((node) => ({
    props: node.data.props as BookingFormProps,
  }));
  return (
    <div className="flex flex-col gap-4 p-3 text-sm text-white">
      <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-400">
        Formulario de Reserva
      </h3>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Variante</span>
        <select
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.variant}
          onChange={(e) =>
            setProp((p: BookingFormProps) => {
              p.variant = e.target.value as BookingVariant;
            })
          }
        >
          {VARIANTS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Título</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.title}
          onChange={(e) =>
            setProp((p: BookingFormProps) => {
              p.title = e.target.value;
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Subtítulo</span>
        <textarea
          rows={2}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white resize-none"
          value={props.subtitle}
          onChange={(e) =>
            setProp((p: BookingFormProps) => {
              p.subtitle = e.target.value;
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Texto del botón</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.submitText}
          onChange={(e) =>
            setProp((p: BookingFormProps) => {
              p.submitText = e.target.value;
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Mensaje de éxito</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.successMessage}
          onChange={(e) =>
            setProp((p: BookingFormProps) => {
              p.successMessage = e.target.value;
            })
          }
        />
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={props.visible}
          onChange={(e) =>
            setProp((p: BookingFormProps) => {
              p.visible = e.target.checked;
            })
          }
        />
        <span className="text-gray-300">Visible</span>
      </label>
    </div>
  );
}
