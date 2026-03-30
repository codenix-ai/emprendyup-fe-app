'use client';
import { useNode } from '@craftjs/core';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { NavigationBarProps, NavLink, NavVariant } from './NavigationBar.props';

const VARIANTS: Array<{ value: NavVariant; label: string }> = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'centered', label: 'Centrado' },
  { value: 'with-cta', label: 'Con botón CTA' },
];

// Shared input style
const INPUT =
  'bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-indigo-500 placeholder-gray-600';
const ICON_BTN =
  'p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-30';

export function NavigationBarSettings() {
  const {
    props,
    actions: { setProp },
  } = useNode<{ props: NavigationBarProps }>((node) => ({
    props: node.data.props as NavigationBarProps,
  }));

  // ── Link helpers ────────────────────────────────────────────────────────────
  function updateLink(index: number, field: keyof NavLink, value: string) {
    setProp((p: NavigationBarProps) => {
      p.links[index][field] = value;
    });
  }

  function addLink() {
    setProp((p: NavigationBarProps) => {
      p.links.push({ label: 'Nuevo enlace', href: '/' });
    });
  }

  function removeLink(index: number) {
    setProp((p: NavigationBarProps) => {
      p.links.splice(index, 1);
    });
  }

  function moveLink(index: number, dir: 'up' | 'down') {
    setProp((p: NavigationBarProps) => {
      const swapIdx = dir === 'up' ? index - 1 : index + 1;
      if (swapIdx < 0 || swapIdx >= p.links.length) return;
      [p.links[index], p.links[swapIdx]] = [p.links[swapIdx], p.links[index]];
    });
  }

  return (
    <div className="flex flex-col gap-4 p-3 text-sm text-white">
      <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-400">Navegación</h3>

      {/* Variante */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Variante</span>
        <select
          className={INPUT}
          value={props.variant}
          onChange={(e) =>
            setProp((p: NavigationBarProps) => {
              p.variant = e.target.value as NavVariant;
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

      {/* Logo */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Nombre / Logo texto</span>
        <input
          className={INPUT}
          value={props.logoText}
          onChange={(e) =>
            setProp((p: NavigationBarProps) => {
              p.logoText = e.target.value;
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">URL del logo (imagen)</span>
        <input
          className={INPUT}
          placeholder="https://..."
          value={props.logoUrl}
          onChange={(e) =>
            setProp((p: NavigationBarProps) => {
              p.logoUrl = e.target.value;
            })
          }
        />
      </label>

      {/* ── Links editor ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 font-medium">Opciones de menú</span>
          <button
            onClick={addLink}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2 py-1 rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
            Agregar
          </button>
        </div>

        {props.links.length === 0 && (
          <p className="text-gray-600 text-xs italic text-center py-2">
            Sin opciones. Haz clic en &quot;Agregar&quot;.
          </p>
        )}

        {props.links.map((link, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-700 bg-gray-800/50 p-2 flex flex-col gap-1.5"
          >
            {/* Row 1: label + order controls + delete */}
            <div className="flex items-center gap-1">
              <input
                className={INPUT}
                value={link.label}
                placeholder="Texto del enlace"
                onChange={(e) => updateLink(i, 'label', e.target.value)}
              />
              <button
                className={ICON_BTN}
                disabled={i === 0}
                onClick={() => moveLink(i, 'up')}
                title="Subir"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                className={ICON_BTN}
                disabled={i === props.links.length - 1}
                onClick={() => moveLink(i, 'down')}
                title="Bajar"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1 rounded hover:bg-red-950/50 text-gray-500 hover:text-red-400 transition-colors"
                onClick={() => removeLink(i)}
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Row 2: href */}
            <input
              className={INPUT}
              value={link.href}
              placeholder="/ruta o https://..."
              onChange={(e) => updateLink(i, 'href', e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* CTA (solo con-cta) */}
      {props.variant === 'with-cta' && (
        <>
          <div className="border-t border-gray-700/60 pt-3 flex flex-col gap-3">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
              Botón CTA
            </span>
            <label className="flex flex-col gap-1">
              <span className="text-gray-300">Texto del botón</span>
              <input
                className={INPUT}
                value={props.ctaText}
                onChange={(e) =>
                  setProp((p: NavigationBarProps) => {
                    p.ctaText = e.target.value;
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-gray-300">URL del botón</span>
              <input
                className={INPUT}
                value={props.ctaHref}
                onChange={(e) =>
                  setProp((p: NavigationBarProps) => {
                    p.ctaHref = e.target.value;
                  })
                }
              />
            </label>
          </div>
        </>
      )}

      {/* Carrito */}
      <div className="border-t border-gray-700/60 pt-3 flex flex-col gap-3">
        <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
          Carrito
        </span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={props.showCart}
            onChange={(e) =>
              setProp((p: NavigationBarProps) => {
                p.showCart = e.target.checked;
              })
            }
          />
          <span className="text-gray-300">Mostrar icono de carrito</span>
        </label>
        {props.showCart && (
          <label className="flex flex-col gap-1">
            <span className="text-gray-300">URL del carrito</span>
            <input
              className={INPUT}
              value={props.cartHref}
              placeholder="/carrito"
              onChange={(e) =>
                setProp((p: NavigationBarProps) => {
                  p.cartHref = e.target.value;
                })
              }
            />
          </label>
        )}
      </div>

      {/* Toggles */}
      <div className="border-t border-gray-700/60 pt-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={props.sticky}
            onChange={(e) =>
              setProp((p: NavigationBarProps) => {
                p.sticky = e.target.checked;
              })
            }
          />
          <span className="text-gray-300">Fijo al hacer scroll (sticky)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={props.visible}
            onChange={(e) =>
              setProp((p: NavigationBarProps) => {
                p.visible = e.target.checked;
              })
            }
          />
          <span className="text-gray-300">Visible</span>
        </label>
      </div>
    </div>
  );
}
