'use client';

import { useNode } from '@craftjs/core';
import type { ContactSectionProps, ContactVariant } from './ContactSection.props';

const VARIANTS: Array<{ value: ContactVariant; label: string }> = [
  { value: 'card', label: 'Tarjeta' },
  { value: 'split', label: 'Dividida' },
  { value: 'minimal', label: 'Minimalista' },
];

export function ContactSectionSettings() {
  const {
    props,
    actions: { setProp },
  } = useNode<{ props: ContactSectionProps }>((node) => ({
    props: node.data.props as ContactSectionProps,
  }));

  return (
    <div className="flex flex-col gap-4 p-3 text-sm text-white">
      <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-400">Contacto</h3>

      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Variante</span>
        <select
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.variant}
          onChange={(e) =>
            setProp((p: ContactSectionProps) => {
              p.variant = e.target.value as ContactVariant;
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
            setProp((p: ContactSectionProps) => {
              p.title = e.target.value;
            })
          }
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Subtítulo</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.subtitle}
          onChange={(e) =>
            setProp((p: ContactSectionProps) => {
              p.subtitle = e.target.value;
            })
          }
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Email</span>
        <input
          type="email"
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.email}
          onChange={(e) =>
            setProp((p: ContactSectionProps) => {
              p.email = e.target.value;
            })
          }
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Teléfono</span>
        <input
          type="tel"
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.phone}
          onChange={(e) =>
            setProp((p: ContactSectionProps) => {
              p.phone = e.target.value;
            })
          }
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Dirección</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.address}
          onChange={(e) =>
            setProp((p: ContactSectionProps) => {
              p.address = e.target.value;
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
            setProp((p: ContactSectionProps) => {
              p.submitText = e.target.value;
            })
          }
        />
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={props.showForm}
          onChange={(e) =>
            setProp((p: ContactSectionProps) => {
              p.showForm = e.target.checked;
            })
          }
        />
        <span className="text-gray-300">Mostrar formulario</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={props.visible}
          onChange={(e) =>
            setProp((p: ContactSectionProps) => {
              p.visible = e.target.checked;
            })
          }
        />
        <span className="text-gray-300">Visible</span>
      </label>
    </div>
  );
}
