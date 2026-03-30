'use client';
import { useNode } from '@craftjs/core';
import type { TestimonialsSectionProps, TestimonialsVariant } from './TestimonialsSection.props';

const VARIANTS: Array<{ value: TestimonialsVariant; label: string }> = [
  { value: 'cards', label: 'Tarjetas' },
  { value: 'minimal', label: 'Minimalista' },
  { value: 'featured', label: 'Destacado' },
];

export function TestimonialsSectionSettings() {
  const {
    props,
    actions: { setProp },
  } = useNode<{ props: TestimonialsSectionProps }>((node) => ({
    props: node.data.props as TestimonialsSectionProps,
  }));
  return (
    <div className="flex flex-col gap-4 p-3 text-sm text-white">
      <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-400">Testimonios</h3>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Variante</span>
        <select
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.variant}
          onChange={(e) =>
            setProp((p: TestimonialsSectionProps) => {
              p.variant = e.target.value as TestimonialsVariant;
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
            setProp((p: TestimonialsSectionProps) => {
              p.title = e.target.value;
            })
          }
        />
      </label>
      <div className="flex flex-col gap-2">
        <span className="text-gray-400 text-xs">Testimonios ({props.items.length})</span>
        {props.items.map((item, i) => (
          <div key={i} className="border border-gray-700 rounded p-2 flex flex-col gap-1.5">
            <input
              placeholder="Nombre"
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
              value={item.name}
              onChange={(e) =>
                setProp((p: TestimonialsSectionProps) => {
                  p.items[i].name = e.target.value;
                })
              }
            />
            <textarea
              placeholder="Texto"
              rows={2}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs resize-none"
              value={item.text}
              onChange={(e) =>
                setProp((p: TestimonialsSectionProps) => {
                  p.items[i].text = e.target.value;
                })
              }
            />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={props.visible}
          onChange={(e) =>
            setProp((p: TestimonialsSectionProps) => {
              p.visible = e.target.checked;
            })
          }
        />
        <span className="text-gray-300">Visible</span>
      </label>
    </div>
  );
}
