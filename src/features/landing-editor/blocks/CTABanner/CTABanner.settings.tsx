'use client';
import { useNode } from '@craftjs/core';
import type { CTABannerProps, CTAVariant } from './CTABanner.props';

const VARIANTS: Array<{ value: CTAVariant; label: string }> = [
  { value: 'gradient', label: 'Degradado' },
  { value: 'boxed', label: 'Recuadro' },
  { value: 'minimal', label: 'Minimal' },
];

export function CTABannerSettings() {
  const {
    props,
    actions: { setProp },
  } = useNode<{ props: CTABannerProps }>((node) => ({ props: node.data.props as CTABannerProps }));
  return (
    <div className="flex flex-col gap-4 p-3 text-sm text-white">
      <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-400">Banner CTA</h3>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Variante</span>
        <select
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.variant}
          onChange={(e) =>
            setProp((p: CTABannerProps) => {
              p.variant = e.target.value as CTAVariant;
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
            setProp((p: CTABannerProps) => {
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
            setProp((p: CTABannerProps) => {
              p.subtitle = e.target.value;
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Texto del botón</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.ctaText}
          onChange={(e) =>
            setProp((p: CTABannerProps) => {
              p.ctaText = e.target.value;
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">URL del botón</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.ctaHref}
          onChange={(e) =>
            setProp((p: CTABannerProps) => {
              p.ctaHref = e.target.value;
            })
          }
        />
      </label>
      <div className="flex gap-2">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-gray-300">Color fondo</span>
          <input
            type="color"
            className="h-8 w-full cursor-pointer rounded bg-gray-800 border border-gray-600"
            value={props.backgroundColor}
            onChange={(e) =>
              setProp((p: CTABannerProps) => {
                p.backgroundColor = e.target.value;
              })
            }
          />
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-gray-300">Color texto</span>
          <input
            type="color"
            className="h-8 w-full cursor-pointer rounded bg-gray-800 border border-gray-600"
            value={props.textColor}
            onChange={(e) =>
              setProp((p: CTABannerProps) => {
                p.textColor = e.target.value;
              })
            }
          />
        </label>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={props.visible}
          onChange={(e) =>
            setProp((p: CTABannerProps) => {
              p.visible = e.target.checked;
            })
          }
        />
        <span className="text-gray-300">Visible</span>
      </label>
    </div>
  );
}
