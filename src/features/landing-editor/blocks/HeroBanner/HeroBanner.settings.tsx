'use client';

import { useNode } from '@craftjs/core';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type {
  HeroBannerProps,
  HeroBannerVariant,
  HeroBannerCTA,
  HeroColumnItem,
} from './HeroBanner.props';

const VARIANTS: Array<{ value: HeroBannerVariant; label: string }> = [
  { value: 'gradient-overlay', label: 'Gradiente con overlay' },
  { value: 'split-image', label: 'Imagen + texto lado a lado' },
  { value: 'minimal', label: 'Minimalista' },
];

const CTA_VARIANTS: Array<{ value: HeroBannerCTA['variant']; label: string }> = [
  { value: 'primary', label: 'Principal' },
  { value: 'outline', label: 'Contorno' },
  { value: 'secondary', label: 'Secundario' },
];

const POSITIONS = [
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
] as const;

const INPUT =
  'bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-indigo-500 placeholder-gray-600';
const SELECT =
  'bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-indigo-500';
const ICON_BTN =
  'p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-30';
const SECTION = 'border-t border-gray-700/60 pt-3 flex flex-col gap-3';

export function HeroBannerSettings() {
  const {
    props,
    actions: { setProp },
  } = useNode<{ props: HeroBannerProps }>((node) => ({
    props: node.data.props as HeroBannerProps,
  }));

  // ── CTA helpers ──────────────────────────────────────────────────────────────
  function updateCta(i: number, field: keyof HeroBannerCTA, value: string) {
    setProp((p: HeroBannerProps) => {
      (p.cta[i] as unknown as Record<string, string>)[field] = value;
    });
  }
  function addCta() {
    setProp((p: HeroBannerProps) => {
      p.cta.push({ text: 'Nuevo botón', href: '/', variant: 'outline' });
    });
  }
  function removeCta(i: number) {
    setProp((p: HeroBannerProps) => {
      p.cta.splice(i, 1);
    });
  }
  function moveCta(i: number, dir: 'up' | 'down') {
    setProp((p: HeroBannerProps) => {
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= p.cta.length) return;
      [p.cta[i], p.cta[j]] = [p.cta[j], p.cta[i]];
    });
  }

  // ── Column helpers ───────────────────────────────────────────────────────────
  function updateCol(i: number, field: keyof HeroColumnItem, value: string) {
    setProp((p: HeroBannerProps) => {
      p.columnItems[i][field] = value;
    });
  }
  function addCol() {
    setProp((p: HeroBannerProps) => {
      p.columnItems.push({ title: 'Nuevo ítem', text: 'Descripción aquí' });
    });
  }
  function removeCol(i: number) {
    setProp((p: HeroBannerProps) => {
      p.columnItems.splice(i, 1);
    });
  }

  return (
    <div className="flex flex-col gap-4 p-3 text-sm text-white">
      <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-400">Hero Banner</h3>

      {/* Variante */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Variante</span>
        <select
          className={SELECT}
          value={props.variant}
          onChange={(e) =>
            setProp((p: HeroBannerProps) => {
              p.variant = e.target.value as HeroBannerVariant;
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

      {/* Título */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Título</span>
        <input
          className={INPUT}
          value={props.title}
          onChange={(e) =>
            setProp((p: HeroBannerProps) => {
              p.title = e.target.value;
            })
          }
        />
      </label>

      {/* Subtítulo */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Subtítulo</span>
        <textarea
          className={`${INPUT} resize-none`}
          rows={3}
          value={props.subtitle}
          onChange={(e) =>
            setProp((p: HeroBannerProps) => {
              p.subtitle = e.target.value;
            })
          }
        />
      </label>

      {/* Imagen de fondo */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">URL imagen de fondo</span>
        <input
          className={INPUT}
          placeholder="https://..."
          value={props.backgroundImage}
          onChange={(e) =>
            setProp((p: HeroBannerProps) => {
              p.backgroundImage = e.target.value;
            })
          }
        />
      </label>

      {/* Overlay */}
      <div className="flex gap-2">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-gray-300">Color overlay</span>
          <input
            type="color"
            className="h-8 w-full cursor-pointer rounded bg-gray-800 border border-gray-600"
            value={props.overlayColor}
            onChange={(e) =>
              setProp((p: HeroBannerProps) => {
                p.overlayColor = e.target.value;
              })
            }
          />
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-gray-300">
            Opacidad ({Math.round(props.overlayOpacity * 100)}%)
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            className="mt-2"
            value={props.overlayOpacity}
            onChange={(e) =>
              setProp((p: HeroBannerProps) => {
                p.overlayOpacity = parseFloat(e.target.value);
              })
            }
          />
        </label>
      </div>

      {/* Altura + Posición */}
      <div className="flex gap-2">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-gray-300">Altura mínima</span>
          <input
            className={INPUT}
            placeholder="80vh"
            value={props.minHeight}
            onChange={(e) =>
              setProp((p: HeroBannerProps) => {
                p.minHeight = e.target.value;
              })
            }
          />
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-gray-300">Posición contenido</span>
          <select
            className={SELECT}
            value={props.contentPosition}
            onChange={(e) =>
              setProp((p: HeroBannerProps) => {
                p.contentPosition = e.target.value as HeroBannerProps['contentPosition'];
              })
            }
          >
            {POSITIONS.map((pos) => (
              <option key={pos.value} value={pos.value}>
                {pos.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ── Botones CTA ── */}
      <div className={SECTION}>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
            Botones
          </span>
          <button
            onClick={addCta}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Plus size={13} /> Agregar
          </button>
        </div>

        {props.cta.length === 0 && (
          <p className="text-gray-500 text-xs italic">Sin botones. Haz clic en Agregar.</p>
        )}

        {props.cta.map((btn, i) => (
          <div
            key={i}
            className="bg-gray-900 rounded p-2 flex flex-col gap-2 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Botón {i + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveCta(i, 'up')} disabled={i === 0} className={ICON_BTN}>
                  <ChevronUp size={13} />
                </button>
                <button
                  onClick={() => moveCta(i, 'down')}
                  disabled={i === props.cta.length - 1}
                  className={ICON_BTN}
                >
                  <ChevronDown size={13} />
                </button>
                <button onClick={() => removeCta(i)} className={`${ICON_BTN} hover:text-red-400`}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <input
              className={INPUT}
              placeholder="Texto del botón"
              value={btn.text}
              onChange={(e) => updateCta(i, 'text', e.target.value)}
            />
            <input
              className={INPUT}
              placeholder="URL destino"
              value={btn.href}
              onChange={(e) => updateCta(i, 'href', e.target.value)}
            />
            <select
              className={SELECT}
              value={btn.variant}
              onChange={(e) => updateCta(i, 'variant', e.target.value)}
            >
              {CTA_VARIANTS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* ── Sección columnas ── */}
      <div className={SECTION}>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
            Sección inferior en columnas
          </span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={props.showColumns}
              onChange={(e) =>
                setProp((p: HeroBannerProps) => {
                  p.showColumns = e.target.checked;
                })
              }
            />
          </label>
        </div>

        {props.showColumns && (
          <>
            <label className="flex items-center gap-2">
              <span className="text-gray-300 text-xs">Columnas:</span>
              {([2, 3] as const).map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    setProp((p: HeroBannerProps) => {
                      p.columns = n;
                    })
                  }
                  className={`px-3 py-1 text-xs rounded border transition-colors ${props.columns === n ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}
                >
                  {n} col
                </button>
              ))}
            </label>

            {props.columnItems.map((col, i) => (
              <div
                key={i}
                className="bg-gray-900 rounded p-2 flex flex-col gap-2 border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Columna {i + 1}</span>
                  <button onClick={() => removeCol(i)} className={`${ICON_BTN} hover:text-red-400`}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <input
                  className={INPUT}
                  placeholder="Título"
                  value={col.title}
                  onChange={(e) => updateCol(i, 'title', e.target.value)}
                />
                <input
                  className={INPUT}
                  placeholder="Descripción"
                  value={col.text}
                  onChange={(e) => updateCol(i, 'text', e.target.value)}
                />
              </div>
            ))}

            <button
              onClick={addCol}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors self-start"
            >
              <Plus size={13} /> Agregar columna
            </button>
          </>
        )}
      </div>

      {/* Visibilidad */}
      <div className={SECTION}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={props.visible}
            onChange={(e) =>
              setProp((p: HeroBannerProps) => {
                p.visible = e.target.checked;
              })
            }
          />
          <span className="text-gray-300">Visible en el sitio</span>
        </label>
      </div>
    </div>
  );
}
