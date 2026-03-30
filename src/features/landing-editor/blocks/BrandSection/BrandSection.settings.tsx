'use client';
import { useNode } from '@craftjs/core';
import type { BrandSectionProps, BrandVariant } from './BrandSection.props';

const VARIANTS: Array<{ value: BrandVariant; label: string }> = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'stacked', label: 'Apilado' },
  { value: 'minimal', label: 'Minimal' },
];

export function BrandSectionSettings() {
  const {
    props,
    actions: { setProp },
  } = useNode<{ props: BrandSectionProps }>((node) => ({
    props: node.data.props as BrandSectionProps,
  }));
  return (
    <div className="flex flex-col gap-4 p-3 text-sm text-white">
      <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-400">Marca</h3>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Variante</span>
        <select
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.variant}
          onChange={(e) =>
            setProp((p: BrandSectionProps) => {
              p.variant = e.target.value as BrandVariant;
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
        <span className="text-gray-300">URL del logo</span>
        <input
          placeholder="https://..."
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.logoUrl}
          onChange={(e) =>
            setProp((p: BrandSectionProps) => {
              p.logoUrl = e.target.value;
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Nombre de la marca</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.name}
          onChange={(e) =>
            setProp((p: BrandSectionProps) => {
              p.name = e.target.value;
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Tagline</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.tagline}
          onChange={(e) =>
            setProp((p: BrandSectionProps) => {
              p.tagline = e.target.value;
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Instagram</span>
        <input
          placeholder="@usuario"
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.socialInstagram}
          onChange={(e) =>
            setProp((p: BrandSectionProps) => {
              p.socialInstagram = e.target.value;
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">WhatsApp</span>
        <input
          placeholder="+57300..."
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.socialWhatsapp}
          onChange={(e) =>
            setProp((p: BrandSectionProps) => {
              p.socialWhatsapp = e.target.value;
            })
          }
        />
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={props.visible}
          onChange={(e) =>
            setProp((p: BrandSectionProps) => {
              p.visible = e.target.checked;
            })
          }
        />
        <span className="text-gray-300">Visible</span>
      </label>
    </div>
  );
}
