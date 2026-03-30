'use client';

import { useNode } from '@craftjs/core';
import type { AboutSectionProps, AboutVariant } from './AboutSection.props';
import { ABOUT_SECTION_VARIANTS } from './AboutSection.props';

export function AboutSectionSettings() {
  const {
    props,
    actions: { setProp },
  } = useNode<{ props: AboutSectionProps }>((node) => ({
    props: node.data.props as AboutSectionProps,
  }));

  return (
    <div className="flex flex-col gap-4 p-3 text-sm text-white">
      <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-400">
        Sobre Nosotros
      </h3>

      {/* Variant */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Estilo de sección</span>
        <select
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.variant}
          onChange={(e) =>
            setProp((p: AboutSectionProps) => {
              p.variant = e.target.value as AboutVariant;
            })
          }
        >
          {(Object.entries(ABOUT_SECTION_VARIANTS) as Array<[AboutVariant, string]>).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </label>

      {/* Title */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Título</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.title}
          onChange={(e) =>
            setProp((p: AboutSectionProps) => {
              p.title = e.target.value;
            })
          }
        />
      </label>

      {/* Description */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Descripción</span>
        <textarea
          rows={4}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white resize-none"
          value={props.description}
          onChange={(e) =>
            setProp((p: AboutSectionProps) => {
              p.description = e.target.value;
            })
          }
        />
      </label>

      {/* Image URL — only relevant for default/side-by-side */}
      {(props.variant === 'default' || props.variant === 'side-by-side') && (
        <label className="flex flex-col gap-1">
          <span className="text-gray-300">URL de imagen</span>
          <input
            placeholder="https://..."
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
            value={props.image}
            onChange={(e) =>
              setProp((p: AboutSectionProps) => {
                p.image = e.target.value;
              })
            }
          />
        </label>
      )}

      {/* Stats — only for with-stats */}
      {props.variant === 'with-stats' && (
        <div className="flex flex-col gap-2">
          <span className="text-gray-400 text-xs">Estadísticas</span>
          {props.stats.map((stat, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="Valor"
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white w-20"
                value={stat.value}
                onChange={(e) =>
                  setProp((p: AboutSectionProps) => {
                    p.stats[i].value = e.target.value;
                  })
                }
              />
              <input
                placeholder="Etiqueta"
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white flex-1"
                value={stat.label}
                onChange={(e) =>
                  setProp((p: AboutSectionProps) => {
                    p.stats[i].label = e.target.value;
                  })
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Visible */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={props.visible}
          onChange={(e) =>
            setProp((p: AboutSectionProps) => {
              p.visible = e.target.checked;
            })
          }
        />
        <span className="text-gray-300">Visible</span>
      </label>
    </div>
  );
}
