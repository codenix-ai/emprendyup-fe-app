'use client';

// ─── PropertiesPanel ───────────────────────────────────────────────────────────
// Panel derecho del editor.
// Cuando hay un nodo seleccionado en el canvas, renderiza su componente `settings`
// definido en `ComponentName.craft = { related: { settings: SettingsComponent } }`.
//
// Mejoras añadidas:
//  - Header con displayName del bloque + ícono de edición
//  - Selector genérico de variante (BLOCK_VARIANTS)
//  - Toggle de visibilidad (visible prop)
//  - Sección "Mejorar con IA" con improveCopy por campo de texto

import React, { useState, useRef } from 'react';
import { useEditor } from '@craftjs/core';
import { Pencil, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { useLandingEditor } from '../context/LandingEditorContext';
import { useAIGeneration } from '../hooks/useAIGeneration';

// ─── Mapa de variantes por bloque ─────────────────────────────────────────────
const BLOCK_VARIANTS: Partial<Record<string, Record<string, string>>> = {
  ProductGrid: { grid: 'Cuadrícula', list: 'Lista', featured: 'Destacado' },
  AboutSection: { default: 'Estándar', timeline: 'Línea de tiempo', team: 'Equipo' },
  HeroBanner: {
    'gradient-overlay': 'Gradiente',
    'split-image': 'Imagen dividida',
    minimal: 'Minimal',
  },
  CTABanner: { centered: 'Centrado', 'side-by-side': 'Lado a lado', minimal: 'Minimal' },
  NavigationBar: { default: 'Estándar', centered: 'Centrado', minimal: 'Minimal' },
  FooterSection: { default: 'Estándar', minimal: 'Minimal', columns: 'Columnas' },
};

// ─── Mapa de props de texto por bloque ────────────────────────────────────────
const TEXT_PROPS: Partial<Record<string, string[]>> = {
  HeroBanner: ['title', 'subtitle', 'ctaLabel'],
  AboutSection: ['title', 'description'],
  TestimonialsSection: ['title'],
  CTABanner: ['title', 'subtitle', 'ctaLabel'],
  ContactSection: ['title', 'subtitle'],
  NavigationBar: ['logoText', 'ctaLabel'],
  FooterSection: ['logoText', 'tagline'],
  BrandSection: ['tagline', 'description'],
  ProductGrid: ['title', 'subtitle'],
  GallerySection: ['title', 'subtitle'],
};

// ─── Helpers de tipo ──────────────────────────────────────────────────────────
function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '…';
}

// ─── Tipos locales ────────────────────────────────────────────────────────────
interface ImproveResults {
  prop: string;
  improvedText: string;
  alternatives: string[];
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function PropertiesPanel() {
  const { actions, selectedNodeId, displayName, currentProps, settingsComponent, isDeletable } =
    useEditor((state, query) => {
      const selectedIds = [...state.events.selected];
      const id = selectedIds[0];
      if (!id) {
        return {
          selectedNodeId: null,
          displayName: null,
          currentProps: null,
          settingsComponent: null,
          isDeletable: false,
        };
      }

      const node = query.node(id).get();
      const Settings = node?.related?.settings as React.ComponentType | undefined;

      return {
        selectedNodeId: id,
        displayName: (node?.data?.displayName as string | undefined) ?? null,
        currentProps: (node?.data?.props as Record<string, unknown> | undefined) ?? null,
        settingsComponent: Settings ?? null,
        isDeletable: query.node(id).isDeletable(),
      };
    });

  // ── AI setup ────────────────────────────────────────────────────────────────
  const { tenant } = useLandingEditor();
  const { improveCopy, isImproving } = useAIGeneration(tenant);

  // ── AI state ────────────────────────────────────────────────────────────────
  const [improvingProp, setImprovingProp] = useState<string | null>(null);
  const [improveResults, setImproveResults] = useState<ImproveResults | null>(null);

  // ── Delete confirmation state ────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDeleteClick() {
    if (!selectedNodeId) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      // Auto-reset confirmation after 3 s if user doesn't click again
      confirmTimerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
    } else {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      actions.delete(selectedNodeId);
      setConfirmDelete(false);
    }
  }

  // ── Variant helpers ──────────────────────────────────────────────────────────
  const variantMap = displayName ? (BLOCK_VARIANTS[displayName] ?? null) : null;
  const currentVariant =
    isRecord(currentProps) && typeof currentProps.variant === 'string' ? currentProps.variant : '';

  // ── Visible helpers ──────────────────────────────────────────────────────────
  const hasVisible = isRecord(currentProps) && typeof currentProps.visible === 'boolean';
  const currentVisible =
    isRecord(currentProps) && typeof currentProps.visible === 'boolean'
      ? currentProps.visible
      : true;

  // ── Text props for AI section ─────────────────────────────────────────────
  const textProps = displayName ? (TEXT_PROPS[displayName] ?? null) : null;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleVariantChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!selectedNodeId) return;
    const newVariant = e.target.value;
    actions.setProp(selectedNodeId, (props: Record<string, unknown>) => {
      props.variant = newVariant;
    });
  }

  function handleVisibleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedNodeId) return;
    const checked = e.target.checked;
    actions.setProp(selectedNodeId, (props: Record<string, unknown>) => {
      props.visible = checked;
    });
  }

  async function handleImprove(propName: string) {
    if (!selectedNodeId || !displayName) return;
    const currentValue =
      isRecord(currentProps) && typeof currentProps[propName] === 'string'
        ? (currentProps[propName] as string)
        : '';

    setImprovingProp(propName);
    setImproveResults(null);

    const result = await improveCopy({
      text: currentValue,
      context: `${propName} del bloque ${displayName}`,
      tenantType: tenant.type,
    });

    if (result) {
      setImproveResults({
        prop: propName,
        improvedText: result.improvedText,
        alternatives: result.alternatives,
      });
    }
    setImprovingProp(null);
  }

  function handleApply(propName: string, text: string) {
    if (!selectedNodeId) return;
    actions.setProp(selectedNodeId, (props: Record<string, unknown>) => {
      props[propName] = text;
    });
    setImproveResults(null);
  }

  function handleCancel() {
    setImproveResults(null);
  }

  return (
    <aside className="w-72 shrink-0 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden">
      {/* ── Panel header ── */}
      <div className="px-3 py-3 border-b border-gray-700">
        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest">
          Propiedades
        </p>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {selectedNodeId ? (
          <>
            {/* ── Block name header + delete ── */}
            {displayName && (
              <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-700/60">
                <Pencil className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-white text-sm font-semibold truncate flex-1">
                  {displayName}
                </span>
                {isDeletable && (
                  <button
                    onClick={handleDeleteClick}
                    title={confirmDelete ? 'Haz clic de nuevo para confirmar' : 'Eliminar sección'}
                    className={[
                      'shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all',
                      confirmDelete
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'text-gray-500 hover:text-red-400 hover:bg-red-950/40',
                    ].join(' ')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {confirmDelete && <span>¿Confirmar?</span>}
                  </button>
                )}
              </div>
            )}

            {/* ── Generic controls (variant + visible) ── */}
            {(variantMap ?? hasVisible) && (
              <div className="px-3 py-3 border-b border-gray-700/60 space-y-3">
                {/* Variant selector */}
                {variantMap && (
                  <div className="space-y-1">
                    <label className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest block">
                      Variante
                    </label>
                    <select
                      value={currentVariant}
                      onChange={handleVariantChange}
                      className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-indigo-500"
                    >
                      {Object.entries(variantMap).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Visible toggle */}
                {hasVisible && (
                  <div className="flex items-center justify-between">
                    <label className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest">
                      Visible
                    </label>
                    <input
                      type="checkbox"
                      checked={currentVisible}
                      onChange={handleVisibleChange}
                      className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── AI "Mejorar con IA" section ── */}
            {textProps && textProps.length > 0 && (
              <div className="px-3 py-3 border-b border-gray-700/60 space-y-3">
                {/* Section header */}
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
                    Mejorar con IA
                  </span>
                </div>

                {/* One row per text prop */}
                {textProps.map((propName) => {
                  const rawValue =
                    isRecord(currentProps) && typeof currentProps[propName] === 'string'
                      ? (currentProps[propName] as string)
                      : '';
                  const isPropImproving = isImproving && improvingProp === propName;
                  const showResults = improveResults !== null && improveResults.prop === propName;

                  return (
                    <div key={propName} className="space-y-1">
                      {/* Prop label + current value + button */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-gray-300 text-xs font-medium">
                            {capitalize(propName)}
                          </span>
                          {rawValue && (
                            <span className="text-gray-500 text-[10px] italic truncate">
                              {truncate(rawValue, 40)}
                            </span>
                          )}
                        </div>

                        {/* ✨ button */}
                        <button
                          onClick={() => {
                            void handleImprove(propName);
                          }}
                          disabled={isImproving}
                          className={[
                            'shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                            isImproving
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-800 hover:bg-indigo-900 text-indigo-400 hover:text-indigo-300 border border-gray-700 hover:border-indigo-600',
                          ].join(' ')}
                          title={`Mejorar "${capitalize(propName)}" con IA`}
                        >
                          {isPropImproving ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Mejorando…</span>
                            </>
                          ) : (
                            <span>✨</span>
                          )}
                        </button>
                      </div>

                      {/* Results popover */}
                      {showResults && improveResults && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mt-2 space-y-2">
                          {/* Main improved text */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                              Sugerencia principal
                            </span>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-gray-200 bg-gray-900 rounded px-2 py-1 flex-1">
                                {improveResults.improvedText}
                              </p>
                              <button
                                onClick={() => handleApply(propName, improveResults.improvedText)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0 pt-1"
                              >
                                Aplicar
                              </button>
                            </div>
                          </div>

                          {/* Alternatives */}
                          {improveResults.alternatives.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                                Alternativas
                              </span>
                              {improveResults.alternatives.map((alt, idx) => (
                                <div key={idx} className="flex items-start justify-between gap-2">
                                  <p className="text-sm text-gray-200 bg-gray-900 rounded px-2 py-1 flex-1">
                                    {alt}
                                  </p>
                                  <button
                                    onClick={() => handleApply(propName, alt)}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0 pt-1"
                                  >
                                    Aplicar
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Cancel */}
                          <div className="pt-1 flex justify-end">
                            <button
                              onClick={handleCancel}
                              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Block-specific settings ── */}
            {settingsComponent ? (
              React.createElement(settingsComponent)
            ) : (
              <div className="p-4 text-center">
                <p className="text-gray-500 text-sm mt-4">
                  Este bloque no tiene propiedades editables.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-center">
            <p className="text-gray-500 text-sm mt-8">
              Selecciona un bloque del canvas para editar sus propiedades.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
