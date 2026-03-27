'use client';
import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
  Image as ImageIcon,
  Type,
  MousePointerClick,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Star,
} from 'lucide-react';
import type {
  PageSection,
  LandingPageConfig,
  BrandColors,
  HeroSectionData,
  FeaturesSectionData,
  CtaSectionData,
  FeatureItem,
} from './types';

interface SectionPanelProps {
  section: PageSection;
  isExpanded: boolean;
  colors: BrandColors;
  onToggleExpand: () => void;
  onToggleEnabled: () => void;
  onUpdate: (data: PageSection['data']) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const SECTION_LABELS: Record<PageSection['type'], string> = {
  hero: 'Hero Banner',
  features: 'Características',
  gallery: 'Galería',
  testimonials: 'Testimonios',
  cta: 'Llamada a la acción',
  contact: 'Contacto',
};

const SECTION_ICONS: Record<PageSection['type'], React.ReactNode> = {
  hero: <ImageIcon size={14} />,
  features: <Star size={14} />,
  gallery: <ImageIcon size={14} />,
  testimonials: <Type size={14} />,
  cta: <MousePointerClick size={14} />,
  contact: <Type size={14} />,
};

const inputCls =
  'w-full bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 placeholder-gray-500';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1';
const colorInputCls = 'w-8 h-8 rounded border border-gray-700 cursor-pointer bg-transparent p-0.5';

// ─── Hero Editor ──────────────────────────────────────────────────────────────
function HeroEditor({
  data,
  onUpdate,
}: {
  data: HeroSectionData;
  onUpdate: (d: HeroSectionData) => void;
}) {
  const u = (patch: Partial<HeroSectionData>) => onUpdate({ ...data, ...patch });
  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Título principal</label>
        <input
          className={inputCls}
          value={data.title}
          onChange={(e) => u({ title: e.target.value })}
          placeholder="Título del hero"
        />
      </div>
      <div>
        <label className={labelCls}>Subtítulo</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={data.subtitle}
          onChange={(e) => u({ subtitle: e.target.value })}
          placeholder="Descripción breve"
        />
      </div>
      <div>
        <label className={labelCls}>URL imagen de fondo</label>
        <input
          className={inputCls}
          value={data.backgroundImage}
          onChange={(e) => u({ backgroundImage: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div>
        <label className={labelCls}>
          Opacidad del overlay: {Math.round(data.overlayOpacity * 100)}%
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={data.overlayOpacity}
          onChange={(e) => u({ overlayOpacity: parseFloat(e.target.value) })}
          className="w-full accent-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Botón principal — texto</label>
          <input
            className={inputCls}
            value={data.ctaText}
            onChange={(e) => u({ ctaText: e.target.value })}
            placeholder="Ver productos"
          />
        </div>
        <div>
          <label className={labelCls}>Botón principal — enlace</label>
          <input
            className={inputCls}
            value={data.ctaLink}
            onChange={(e) => u({ ctaLink: e.target.value })}
            placeholder="/productos"
          />
        </div>
        <div>
          <label className={labelCls}>Botón secundario — texto</label>
          <input
            className={inputCls}
            value={data.ctaSecondaryText}
            onChange={(e) => u({ ctaSecondaryText: e.target.value })}
            placeholder="Contáctanos"
          />
        </div>
        <div>
          <label className={labelCls}>Botón secundario — enlace</label>
          <input
            className={inputCls}
            value={data.ctaSecondaryLink}
            onChange={(e) => u({ ctaSecondaryLink: e.target.value })}
            placeholder="/contacto"
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>Alineación del contenido</label>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => u({ alignment: align })}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded border text-xs transition-colors ${data.alignment === align ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
            >
              {align === 'left' && <AlignLeft size={13} />}
              {align === 'center' && <AlignCenter size={13} />}
              {align === 'right' && <AlignRight size={13} />}
              {align === 'left' ? 'Izquierda' : align === 'center' ? 'Centro' : 'Derecha'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Features Editor ──────────────────────────────────────────────────────────
function FeaturesEditor({
  data,
  onUpdate,
}: {
  data: FeaturesSectionData;
  onUpdate: (d: FeaturesSectionData) => void;
}) {
  const u = (patch: Partial<FeaturesSectionData>) => onUpdate({ ...data, ...patch });

  const updateItem = (id: string, patch: Partial<FeatureItem>) =>
    u({ items: data.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });

  const addItem = () =>
    u({
      items: [
        ...data.items,
        {
          id: Date.now().toString(),
          icon: '✨',
          title: 'Nueva característica',
          description: 'Descripción',
        },
      ],
    });

  const removeItem = (id: string) => u({ items: data.items.filter((it) => it.id !== id) });

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Título de sección</label>
        <input
          className={inputCls}
          value={data.title}
          onChange={(e) => u({ title: e.target.value })}
        />
      </div>
      <div>
        <label className={labelCls}>Subtítulo</label>
        <input
          className={inputCls}
          value={data.subtitle}
          onChange={(e) => u({ subtitle: e.target.value })}
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls + ' mb-0'}>Características</label>
          <button
            onClick={addItem}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <Plus size={12} /> Agregar
          </button>
        </div>
        <div className="space-y-3">
          {data.items.map((item) => (
            <div key={item.id} className="bg-gray-900 border border-gray-700 rounded p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className={`${inputCls} w-16 text-center text-lg`}
                  value={item.icon}
                  onChange={(e) => updateItem(item.id, { icon: e.target.value })}
                  placeholder="🚀"
                />
                <input
                  className={inputCls}
                  value={item.title}
                  onChange={(e) => updateItem(item.id, { title: e.target.value })}
                  placeholder="Título"
                />
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-400 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                className={inputCls}
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                placeholder="Descripción"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CTA Editor ───────────────────────────────────────────────────────────────
function CtaEditor({
  data,
  onUpdate,
}: {
  data: CtaSectionData;
  onUpdate: (d: CtaSectionData) => void;
}) {
  const u = (patch: Partial<CtaSectionData>) => onUpdate({ ...data, ...patch });
  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Título</label>
        <input
          className={inputCls}
          value={data.title}
          onChange={(e) => u({ title: e.target.value })}
        />
      </div>
      <div>
        <label className={labelCls}>Subtítulo</label>
        <input
          className={inputCls}
          value={data.subtitle}
          onChange={(e) => u({ subtitle: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Texto del botón</label>
          <input
            className={inputCls}
            value={data.buttonText}
            onChange={(e) => u({ buttonText: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Enlace del botón</label>
          <input
            className={inputCls}
            value={data.buttonLink}
            onChange={(e) => u({ buttonLink: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>Estilo de fondo</label>
        <div className="flex gap-2">
          {(['primary', 'dark', 'light'] as const).map((s) => (
            <button
              key={s}
              onClick={() => u({ backgroundStyle: s })}
              className={`flex-1 py-2 rounded border text-xs transition-colors ${data.backgroundStyle === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
            >
              {s === 'primary' ? 'Color primario' : s === 'dark' ? 'Oscuro' : 'Claro'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section Panel ────────────────────────────────────────────────────────────
export function SectionPanel({
  section,
  isExpanded,
  colors,
  onToggleExpand,
  onToggleEnabled,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
  isFirst,
  isLast,
}: SectionPanelProps) {
  return (
    <div
      className={`rounded-lg border transition-colors ${section.enabled ? 'border-gray-700 bg-gray-800' : 'border-gray-800 bg-gray-850 opacity-60'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical size={14} className="text-gray-600 flex-shrink-0" />
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-gray-500 flex-shrink-0">{SECTION_ICONS[section.type]}</span>
          <span className="text-sm font-medium text-gray-200 truncate">
            {SECTION_LABELS[section.type]}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            disabled={isFirst}
            onClick={onMoveUp}
            className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>
          <button
            disabled={isLast}
            onClick={onMoveDown}
            className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={onToggleEnabled}
            title={section.enabled ? 'Ocultar' : 'Mostrar'}
            className="p-1 text-gray-500 hover:text-gray-300"
          >
            {section.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button onClick={onRemove} className="p-1 text-red-600 hover:text-red-400">
            <Trash2 size={14} />
          </button>
          <button onClick={onToggleExpand} className="p-1 text-gray-500 hover:text-gray-300">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-700">
          {section.type === 'hero' && (
            <HeroEditor data={section.data as HeroSectionData} onUpdate={(d) => onUpdate(d)} />
          )}
          {section.type === 'features' && (
            <FeaturesEditor
              data={section.data as FeaturesSectionData}
              onUpdate={(d) => onUpdate(d)}
            />
          )}
          {section.type === 'cta' && (
            <CtaEditor data={section.data as CtaSectionData} onUpdate={(d) => onUpdate(d)} />
          )}
          {(section.type === 'gallery' ||
            section.type === 'testimonials' ||
            section.type === 'contact') && (
            <p className="text-xs text-gray-500 italic py-2">Editor disponible próximamente.</p>
          )}
        </div>
      )}
    </div>
  );
}
