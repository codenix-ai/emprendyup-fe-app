'use client';
import { useNode } from '@craftjs/core';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { FooterSectionProps, FooterColumn, FooterLink } from './FooterSection.props';

const INPUT =
  'bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-indigo-500 placeholder-gray-600';
const ICON_BTN =
  'p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-30';
const SECTION = 'border-t border-gray-700/60 pt-3 flex flex-col gap-3';

export function FooterSectionSettings() {
  const {
    props,
    actions: { setProp },
  } = useNode<{ props: FooterSectionProps }>((node) => ({
    props: node.data.props as FooterSectionProps,
  }));

  // ── Column helpers ────────────────────────────────────────────────────────
  function addColumn() {
    if (props.columns.length >= 4) return;
    setProp((p: FooterSectionProps) => {
      p.columns.push({ title: 'Nueva sección', links: [{ label: 'Enlace', href: '/' }] });
    });
  }
  function removeColumn(ci: number) {
    if (props.columns.length <= 1) return;
    setProp((p: FooterSectionProps) => {
      p.columns.splice(ci, 1);
    });
  }
  function updateColumnTitle(ci: number, value: string) {
    setProp((p: FooterSectionProps) => {
      p.columns[ci].title = value;
    });
  }
  function moveColumn(ci: number, dir: 'up' | 'down') {
    setProp((p: FooterSectionProps) => {
      const j = dir === 'up' ? ci - 1 : ci + 1;
      if (j < 0 || j >= p.columns.length) return;
      [p.columns[ci], p.columns[j]] = [p.columns[j], p.columns[ci]];
    });
  }

  // ── Link helpers ──────────────────────────────────────────────────────────
  function addLink(ci: number) {
    setProp((p: FooterSectionProps) => {
      p.columns[ci].links.push({ label: 'Nuevo enlace', href: '/' });
    });
  }
  function removeLink(ci: number, li: number) {
    setProp((p: FooterSectionProps) => {
      p.columns[ci].links.splice(li, 1);
    });
  }
  function updateLink(ci: number, li: number, field: keyof FooterLink, value: string) {
    setProp((p: FooterSectionProps) => {
      p.columns[ci].links[li][field] = value;
    });
  }
  function moveLink(ci: number, li: number, dir: 'up' | 'down') {
    setProp((p: FooterSectionProps) => {
      const col = p.columns[ci];
      const j = dir === 'up' ? li - 1 : li + 1;
      if (j < 0 || j >= col.links.length) return;
      [col.links[li], col.links[j]] = [col.links[j], col.links[li]];
    });
  }

  return (
    <div className="flex flex-col gap-4 p-3 text-sm text-white">
      <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-400">Footer</h3>

      {/* Brand */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Nombre de la empresa</span>
        <input
          className={INPUT}
          value={props.companyName}
          onChange={(e) =>
            setProp((p: FooterSectionProps) => {
              p.companyName = e.target.value;
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Tagline</span>
        <input
          className={INPUT}
          value={props.tagline}
          onChange={(e) =>
            setProp((p: FooterSectionProps) => {
              p.tagline = e.target.value;
            })
          }
        />
      </label>

      {/* Social */}
      <div className={SECTION}>
        <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
          Redes sociales
        </span>
        <label className="flex flex-col gap-1">
          <span className="text-gray-300">Instagram</span>
          <input
            className={INPUT}
            placeholder="@usuario"
            value={props.socialInstagram}
            onChange={(e) =>
              setProp((p: FooterSectionProps) => {
                p.socialInstagram = e.target.value;
              })
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-300">Facebook</span>
          <input
            className={INPUT}
            placeholder="URL"
            value={props.socialFacebook}
            onChange={(e) =>
              setProp((p: FooterSectionProps) => {
                p.socialFacebook = e.target.value;
              })
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-300">TikTok</span>
          <input
            className={INPUT}
            placeholder="@usuario"
            value={props.socialTiktok}
            onChange={(e) =>
              setProp((p: FooterSectionProps) => {
                p.socialTiktok = e.target.value;
              })
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-300">WhatsApp</span>
          <input
            className={INPUT}
            placeholder="+57300..."
            value={props.socialWhatsapp}
            onChange={(e) =>
              setProp((p: FooterSectionProps) => {
                p.socialWhatsapp = e.target.value;
              })
            }
          />
        </label>
      </div>

      {/* Floating WhatsApp */}
      <div className={SECTION}>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
            Botón flotante WhatsApp
          </span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={props.showWhatsappFloat}
              onChange={(e) =>
                setProp((p: FooterSectionProps) => {
                  p.showWhatsappFloat = e.target.checked;
                })
              }
            />
          </label>
        </div>
        {props.showWhatsappFloat && (
          <>
            <p className="text-gray-500 text-xs">Requiere número de WhatsApp configurado arriba.</p>
            <label className="flex flex-col gap-1">
              <span className="text-gray-300">Mensaje predefinido</span>
              <textarea
                className={`${INPUT} resize-none`}
                rows={2}
                placeholder="Hola, me gustaría más información."
                value={props.whatsappFloatMessage}
                onChange={(e) =>
                  setProp((p: FooterSectionProps) => {
                    p.whatsappFloatMessage = e.target.value;
                  })
                }
              />
            </label>
          </>
        )}
      </div>

      {/* Columns */}
      <div className={SECTION}>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
            Columnas ({props.columns.length}/4)
          </span>
          <button
            onClick={addColumn}
            disabled={props.columns.length >= 4}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-30"
          >
            <Plus size={13} /> Columna
          </button>
        </div>

        {/* Column count pills */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={`px-2 py-0.5 text-xs rounded border ${props.columns.length === n ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-gray-600 text-gray-500'}`}
            >
              {n}
            </span>
          ))}
          <span className="text-gray-500 text-xs ml-1 self-center">columnas activas</span>
        </div>

        {props.columns.map((col, ci) => (
          <div key={ci} className="bg-gray-900 rounded border border-gray-700 overflow-hidden">
            {/* Column header */}
            <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-800">
              <input
                className="bg-transparent text-white text-xs font-semibold flex-1 focus:outline-none border-b border-transparent focus:border-indigo-500"
                value={col.title}
                onChange={(e) => updateColumnTitle(ci, e.target.value)}
              />
              <button onClick={() => moveColumn(ci, 'up')} disabled={ci === 0} className={ICON_BTN}>
                <ChevronUp size={12} />
              </button>
              <button
                onClick={() => moveColumn(ci, 'down')}
                disabled={ci === props.columns.length - 1}
                className={ICON_BTN}
              >
                <ChevronDown size={12} />
              </button>
              <button
                onClick={() => removeColumn(ci)}
                disabled={props.columns.length <= 1}
                className={`${ICON_BTN} hover:text-red-400 disabled:opacity-20`}
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Links */}
            <div className="p-2 flex flex-col gap-1.5">
              {col.links.map((link, li) => (
                <div key={li} className="flex items-center gap-1">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <input
                      className={INPUT}
                      placeholder="Texto"
                      value={link.label}
                      onChange={(e) => updateLink(ci, li, 'label', e.target.value)}
                    />
                    <input
                      className={`${INPUT} text-xs`}
                      placeholder="URL"
                      value={link.href}
                      onChange={(e) => updateLink(ci, li, 'href', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveLink(ci, li, 'up')}
                      disabled={li === 0}
                      className={ICON_BTN}
                    >
                      <ChevronUp size={11} />
                    </button>
                    <button
                      onClick={() => moveLink(ci, li, 'down')}
                      disabled={li === col.links.length - 1}
                      className={ICON_BTN}
                    >
                      <ChevronDown size={11} />
                    </button>
                    <button
                      onClick={() => removeLink(ci, li)}
                      className={`${ICON_BTN} hover:text-red-400`}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addLink(ci)}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-1 self-start"
              >
                <Plus size={11} /> Enlace
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Copyright */}
      <div className={SECTION}>
        <label className="flex flex-col gap-1">
          <span className="text-gray-300">Texto de copyright</span>
          <input
            className={INPUT}
            value={props.copyrightText}
            onChange={(e) =>
              setProp((p: FooterSectionProps) => {
                p.copyrightText = e.target.value;
              })
            }
          />
        </label>
      </div>

      {/* Visible */}
      <div className={SECTION}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={props.visible}
            onChange={(e) =>
              setProp((p: FooterSectionProps) => {
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
