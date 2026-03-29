'use client';
import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { DRAFT_SECTION_META } from './types';
import type { DraftHeroConfig, ButtonConfig, TextStyle } from './types';
import UnsplashPicker from '@/app/components/UnsplashPicker/UnsplashPicker';
import type { PickerPhoto } from '@/app/components/UnsplashPicker/types';

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls =
  'w-full bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 placeholder-gray-500';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert camelCase key to a human label */
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// ── Style Controls Panel ──────────────────────────────────────────────────────
// Collapsible panel for editing a TextStyle (color, size, weight, alignment).

function StyleControlsPanel({
  label,
  style,
  onChange,
}: {
  label: string;
  style: TextStyle | undefined;
  onChange: (s: TextStyle) => void;
}) {
  const [open, setOpen] = useState(false);
  const s = style ?? {};
  const u = (patch: Partial<TextStyle>) => onChange({ ...s, ...patch });

  return (
    <div className="border border-gray-700 rounded overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 transition-colors"
      >
        <span>{label}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="p-3 space-y-3 bg-gray-900">
          {/* Font family */}
          <div>
            <label className={labelCls}>Fuente</label>
            <select
              className={inputCls}
              value={s.fontFamily || ''}
              onChange={(e) => u({ fontFamily: e.target.value || undefined })}
            >
              <option value="">Por defecto</option>
              <optgroup label="Serif">
                <option value="'Cormorant Garamond', serif">Cormorant Garamond</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
              </optgroup>
              <optgroup label="Sans-serif">
                <option value="'Jost', sans-serif">Jost</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="'Montserrat', sans-serif">Montserrat</option>
                <option value="'Open Sans', sans-serif">Open Sans</option>
                <option value="Arial, sans-serif">Arial</option>
              </optgroup>
              <optgroup label="Monospace">
                <option value="'Courier New', monospace">Courier New</option>
              </optgroup>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Color del texto</label>
              <div className="flex gap-1">
                <input
                  type="color"
                  value={s.color || '#ffffff'}
                  onChange={(e) => u({ color: e.target.value })}
                  className="w-8 h-8 border border-gray-700 rounded cursor-pointer bg-transparent p-0.5 shrink-0"
                />
                <input
                  className={`${inputCls} flex-1 min-w-0`}
                  value={s.color || ''}
                  onChange={(e) => u({ color: e.target.value })}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tamaño de fuente</label>
              <input
                className={inputCls}
                value={s.fontSize || ''}
                onChange={(e) => u({ fontSize: e.target.value || undefined })}
                placeholder="2rem"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Peso de fuente</label>
              <select
                className={inputCls}
                value={s.fontWeight || ''}
                onChange={(e) => u({ fontWeight: e.target.value || undefined })}
              >
                <option value="">Por defecto</option>
                <option value="300">Light (300)</option>
                <option value="400">Normal (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extrabold (800)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Estilo</label>
              <select
                className={inputCls}
                value={s.fontStyle || ''}
                onChange={(e) => u({ fontStyle: e.target.value || undefined })}
              >
                <option value="">Normal</option>
                <option value="italic">Italic</option>
                <option value="oblique">Oblique</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Interletrado</label>
              <input
                className={inputCls}
                value={s.letterSpacing || ''}
                onChange={(e) => u({ letterSpacing: e.target.value || undefined })}
                placeholder="0.05em"
              />
            </div>
            <div>
              <label className={labelCls}>Interlineado</label>
              <input
                className={inputCls}
                value={s.lineHeight || ''}
                onChange={(e) => u({ lineHeight: e.target.value || undefined })}
                placeholder="1.5"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Alineación</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => u({ textAlign: align })}
                  className={`flex-1 flex items-center justify-center py-1.5 rounded border text-xs transition-colors ${
                    s.textAlign === align
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {align === 'left' && <AlignLeft size={11} />}
                  {align === 'center' && <AlignCenter size={11} />}
                  {align === 'right' && <AlignRight size={11} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Button Entry ──────────────────────────────────────────────────────────────
// Rich editor for a single ButtonConfig with collapsible style controls.

function ButtonEntry({
  button,
  index,
  onUpdate,
  onRemove,
}: {
  button: ButtonConfig;
  index: number;
  onUpdate: (patch: Partial<ButtonConfig>) => void;
  onRemove: () => void;
}) {
  const [stylesOpen, setStylesOpen] = useState(false);
  const href =
    typeof (button.href ?? button.link) === 'string'
      ? String(button.href ?? button.link ?? '')
      : '';

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">Botón {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-400">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Texto</label>
          <input
            className={inputCls}
            value={typeof button.text === 'string' ? button.text : ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Ver más"
          />
        </div>
        <div>
          <label className={labelCls}>Enlace (href)</label>
          <input
            className={inputCls}
            value={href}
            onChange={(e) => onUpdate({ href: e.target.value, link: e.target.value })}
            placeholder="/products"
          />
        </div>
      </div>
      <div className="border border-gray-700 rounded overflow-hidden">
        <button
          type="button"
          onClick={() => setStylesOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-800 text-xs text-gray-400 hover:bg-gray-700 transition-colors"
        >
          <span>Estilo del botón</span>
          {stylesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {stylesOpen && (
          <div className="p-3 space-y-2 bg-gray-900">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Color de fondo</label>
                <div className="flex gap-1">
                  <input
                    type="color"
                    value={String(button.backgroundColor || '#3b82f6')}
                    onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                    className="w-8 h-8 border border-gray-700 rounded cursor-pointer bg-transparent p-0.5 shrink-0"
                  />
                  <input
                    className={`${inputCls} flex-1 min-w-0`}
                    value={String(button.backgroundColor || '')}
                    onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Color de texto</label>
                <div className="flex gap-1">
                  <input
                    type="color"
                    value={String(button.textColor || '#ffffff')}
                    onChange={(e) => onUpdate({ textColor: e.target.value })}
                    className="w-8 h-8 border border-gray-700 rounded cursor-pointer bg-transparent p-0.5 shrink-0"
                  />
                  <input
                    className={`${inputCls} flex-1 min-w-0`}
                    value={String(button.textColor || '')}
                    onChange={(e) => onUpdate({ textColor: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelCls}>Tamaño fuente</label>
                <input
                  className={inputCls}
                  value={String(button.fontSize || '')}
                  onChange={(e) => onUpdate({ fontSize: e.target.value })}
                  placeholder="14px"
                />
              </div>
              <div>
                <label className={labelCls}>Peso</label>
                <select
                  className={inputCls}
                  value={String(button.fontWeight || '')}
                  onChange={(e) => onUpdate({ fontWeight: e.target.value })}
                >
                  <option value="">Auto</option>
                  <option value="400">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">Semibold</option>
                  <option value="700">Bold</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Radio bordes</label>
                <input
                  className={inputCls}
                  value={String(button.borderRadius || '')}
                  onChange={(e) => onUpdate({ borderRadius: e.target.value })}
                  placeholder="8px"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Padding</label>
              <input
                className={inputCls}
                value={String(button.padding || '')}
                onChange={(e) => onUpdate({ padding: e.target.value })}
                placeholder="12px 24px"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hero Draft Editor ─────────────────────────────────────────────────────────
// Specialised editor for the `hero` draftConfig key.

function HeroDraftEditor({
  data,
  onUpdate,
}: {
  data: DraftHeroConfig;
  onUpdate: (next: DraftHeroConfig) => void;
}) {
  const u = (patch: Partial<DraftHeroConfig>) => onUpdate({ ...data, ...patch });

  const bgImageUrl =
    typeof data.backgroundImage === 'string'
      ? data.backgroundImage
      : (((data.backgroundImage as Record<string, unknown> | undefined)?.url as string) ??
        ((data.backgroundImage as Record<string, unknown> | undefined)?.unsplashUrl as string) ??
        '');

  const setBgImageUrl = (url: string) =>
    u({
      backgroundImage: {
        ...(typeof data.backgroundImage === 'object' && data.backgroundImage !== null
          ? (data.backgroundImage as Record<string, unknown>)
          : {}),
        url,
      },
    });

  const setUnsplashPhoto = (photo: PickerPhoto) =>
    u({
      backgroundImage: {
        url: photo.url,
        unsplashUrl: photo.url,
        id: photo.id,
        alt: photo.alt || 'Hero background',
      },
    });

  const buttons: ButtonConfig[] = Array.isArray(data.buttons) ? data.buttons : [];
  const updateButton = (idx: number, patch: Partial<ButtonConfig>) =>
    u({ buttons: buttons.map((b, i) => (i === idx ? { ...b, ...patch } : b)) });
  const addButton = () => u({ buttons: [...buttons, { text: '', link: '', href: '' }] });
  const removeButton = (idx: number) => u({ buttons: buttons.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-4">
      {/* Section toggle */}
      <label className="flex items-center justify-between py-2 px-3 bg-gray-900 rounded-lg cursor-pointer border border-gray-700">
        <span className="text-sm text-gray-300">Mostrar sección Hero</span>
        <div
          onClick={() => u({ enabled: data.enabled === false ? true : false })}
          className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
            data.enabled === false ? 'bg-gray-700' : 'bg-blue-600'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              data.enabled === false ? 'translate-x-0.5' : 'translate-x-[18px]'
            }`}
          />
        </div>
      </label>

      {/* Title */}
      <div>
        <label className={labelCls}>Título principal</label>
        <input
          className={inputCls}
          value={typeof data.title === 'string' ? data.title : ''}
          onChange={(e) => u({ title: e.target.value })}
          placeholder="Bienvenido a nuestra tienda"
        />
        <div className="mt-2">
          <StyleControlsPanel
            label="Estilo del título"
            style={data.titleStyle}
            onChange={(s) => u({ titleStyle: s })}
          />
        </div>
      </div>

      {/* Subtitle */}
      <div>
        <label className={labelCls}>Subtítulo</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={typeof data.subtitle === 'string' ? data.subtitle : ''}
          onChange={(e) => u({ subtitle: e.target.value })}
          placeholder="Descubre nuestra colección"
        />
        <div className="mt-2">
          <StyleControlsPanel
            label="Estilo del subtítulo"
            style={data.subtitleStyle}
            onChange={(s) => u({ subtitleStyle: s })}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Descripción</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          value={typeof data.description === 'string' ? data.description : ''}
          onChange={(e) => u({ description: e.target.value })}
          placeholder="Texto descriptivo adicional..."
        />
        <div className="mt-2">
          <StyleControlsPanel
            label="Estilo de la descripción"
            style={data.descriptionStyle}
            onChange={(s) => u({ descriptionStyle: s })}
          />
        </div>
      </div>

      {/* Background image + Unsplash picker */}
      <div>
        {/* New UnsplashPicker component */}
        <UnsplashPicker
          perPage={12}
          onSelect={(photo) => {
            setUnsplashPhoto(photo);
          }}
        />
      </div>

      {/* Background color (used when no image is set) */}
      <div>
        <label className={labelCls}>Color de fondo</label>
        <p className="text-xs text-gray-500 mb-2">
          Se usa cuando no hay imagen de fondo seleccionada.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(data.backgroundColor as string) || '#1A1512'}
            onChange={(e) => u({ backgroundColor: e.target.value })}
            className="w-9 h-9 rounded border border-gray-700 cursor-pointer bg-transparent p-0.5 flex-shrink-0"
          />
          <input
            className={inputCls}
            value={(data.backgroundColor as string) || ''}
            onChange={(e) => u({ backgroundColor: e.target.value })}
            placeholder="#1A1512 o cualquier valor CSS"
          />
          {data.backgroundColor && (
            <button
              type="button"
              onClick={() => u({ backgroundColor: undefined })}
              className="p-2 text-gray-500 hover:text-gray-300 flex-shrink-0"
              title="Restablecer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Overlay opacity */}
      <div>
        <label className={labelCls}>
          Opacidad del overlay: {Math.round(((data.overlayOpacity as number) ?? 0.4) * 100)}%
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={(data.overlayOpacity as number) ?? 0.4}
          onChange={(e) => u({ overlayOpacity: parseFloat(e.target.value) })}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Content position */}
      <div>
        <label className={labelCls}>Posición del contenido</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-gray-500 mb-1">Horizontal</div>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => u({ alignment: align, contentPosition: align })}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded border text-xs transition-colors ${
                    (data.contentPosition ?? data.alignment) === align
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {align === 'left' && <AlignLeft size={13} />}
                  {align === 'center' && <AlignCenter size={13} />}
                  {align === 'right' && <AlignRight size={13} />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Vertical</div>
            <select
              className={inputCls}
              value={(data.contentVertical as string) || 'center'}
              onChange={(e) =>
                u({ contentVertical: e.target.value as 'top' | 'center' | 'bottom' })
              }
            >
              <option value="top">Arriba</option>
              <option value="center">Centro</option>
              <option value="bottom">Abajo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`${labelCls} mb-0`}>Botones de acción</label>
          <button
            type="button"
            onClick={addButton}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <Plus size={12} /> Agregar
          </button>
        </div>
        <div className="space-y-2">
          {buttons.map((btn, i) => (
            <ButtonEntry
              key={i}
              button={btn}
              index={i}
              onUpdate={(patch) => updateButton(i, patch)}
              onRemove={() => removeButton(i)}
            />
          ))}
          {buttons.length === 0 && (
            <p className="text-xs text-gray-600 italic">
              Sin botones. Haz clic en &quot;Agregar&quot;.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Generic field editor ──────────────────────────────────────────────────────
// Renders inputs for string/number/boolean, and a read-only JSON for objects/arrays.

function FieldEditor({
  data,
  onUpdate,
  path = '',
}: {
  data: Record<string, unknown>;
  onUpdate: (next: Record<string, unknown>) => void;
  path?: string;
}) {
  const updateField = (key: string, value: unknown) => {
    onUpdate({ ...data, [key]: value });
  };

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => {
        const fieldPath = path ? `${path}.${key}` : key;

        if (typeof value === 'string') {
          const isLong = value.length > 80;
          return (
            <div key={fieldPath}>
              <label className={labelCls}>{formatLabel(key)}</label>
              {isLong ? (
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  value={value}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              ) : (
                <input
                  className={inputCls}
                  value={value}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              )}
            </div>
          );
        }

        if (typeof value === 'number') {
          return (
            <div key={fieldPath}>
              <label className={labelCls}>{formatLabel(key)}</label>
              <input
                type="number"
                className={inputCls}
                value={value}
                onChange={(e) => updateField(key, parseFloat(e.target.value) || 0)}
              />
            </div>
          );
        }

        if (typeof value === 'boolean') {
          return (
            <label key={fieldPath} className="flex items-center gap-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => updateField(key, e.target.checked)}
                className="accent-blue-500"
              />
              <span className="text-xs text-gray-400">{formatLabel(key)}</span>
            </label>
          );
        }

        // Nested object (not array) → recurse
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return (
            <NestedObjectField
              key={fieldPath}
              label={formatLabel(key)}
              data={value as Record<string, unknown>}
              onUpdate={(next) => updateField(key, next)}
              path={fieldPath}
            />
          );
        }

        // Array → show items with expandable JSON
        if (Array.isArray(value)) {
          return (
            <ArrayField
              key={fieldPath}
              label={formatLabel(key)}
              items={value}
              onUpdate={(next) => updateField(key, next)}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

// ── Nested object (collapsible) ───────────────────────────────────────────────
function NestedObjectField({
  label,
  data,
  onUpdate,
  path,
}: {
  label: string;
  data: Record<string, unknown>;
  onUpdate: (next: Record<string, unknown>) => void;
  path: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-750 text-xs text-gray-300"
      >
        <span>{label}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="p-3 bg-gray-850">
          <FieldEditor data={data} onUpdate={onUpdate} path={path} />
        </div>
      )}
    </div>
  );
}

// ── Array field (read-only JSON for now, with item count) ─────────────────────
function ArrayField({
  label,
  items,
  onUpdate,
}: {
  label: string;
  items: unknown[];
  onUpdate: (next: unknown[]) => void;
}) {
  const [open, setOpen] = useState(false);

  // If array items are objects, render fields for each
  const hasObjectItems = items.length > 0 && typeof items[0] === 'object' && items[0] !== null;

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-750 text-xs text-gray-300"
      >
        <span>
          {label} <span className="text-gray-500 ml-1">({items.length} items)</span>
        </span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="p-3 bg-gray-850 space-y-2">
          {hasObjectItems ? (
            items.map((item, idx) => (
              <div key={idx} className="border border-gray-700 rounded p-2 bg-gray-900">
                <span className="text-xs text-gray-500 block mb-2">#{idx + 1}</span>
                <FieldEditor
                  data={item as Record<string, unknown>}
                  onUpdate={(next) => {
                    const copy = [...items];
                    copy[idx] = next;
                    onUpdate(copy);
                  }}
                  path={`${label}[${idx}]`}
                />
              </div>
            ))
          ) : (
            <pre className="text-xs text-gray-500 max-h-40 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(items, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main panel component ──────────────────────────────────────────────────────

interface DraftSectionPanelProps {
  sectionKey: string;
  data: Record<string, unknown>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (next: Record<string, unknown>) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function DraftSectionPanel({
  sectionKey,
  data,
  isExpanded,
  onToggleExpand,
  onUpdate,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: DraftSectionPanelProps) {
  const meta = DRAFT_SECTION_META[sectionKey] ?? {
    label: formatLabel(sectionKey),
    icon: '📄',
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 transition-colors">
      {/* Header */}
      <div className="flex items-center">
        <button
          onClick={onToggleExpand}
          className="flex-1 flex items-center gap-2 px-3 py-2.5 hover:bg-gray-750 transition-colors min-w-0"
        >
          <span className="text-base flex-shrink-0">{meta.icon}</span>
          <span className="text-sm font-medium text-gray-200 truncate flex-1 text-left">
            {meta.label}
          </span>
          <span className="text-gray-500 flex-shrink-0 mr-1">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>
        <div className="flex flex-col border-l border-gray-700 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp?.();
            }}
            disabled={!canMoveUp}
            className="px-2 py-1 text-gray-500 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Mover arriba"
          >
            <ChevronUp size={11} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown?.();
            }}
            disabled={!canMoveDown}
            className="px-2 py-1 text-gray-500 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors border-t border-gray-700"
            title="Mover abajo"
          >
            <ChevronDown size={11} />
          </button>
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-700">
          {data && typeof data === 'object' ? (
            sectionKey === 'hero' ? (
              <HeroDraftEditor
                data={data as DraftHeroConfig}
                onUpdate={(next) => onUpdate(next as Record<string, unknown>)}
              />
            ) : (
              <FieldEditor data={data} onUpdate={onUpdate} />
            )
          ) : (
            <p className="text-xs text-gray-500 italic py-2">Sin datos para esta sección.</p>
          )}
        </div>
      )}
    </div>
  );
}
