'use client';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_STORE_BY_CUSTOM_DOMAIN, SAVE_PAGE_DRAFT, PUBLISH_PAGE } from '@/lib/graphql/queries';
import {
  Save,
  Globe,
  Eye,
  Plus,
  Palette,
  Layers,
  AlertCircle,
  Monitor,
  Smartphone,
  RefreshCw,
  CheckCircle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LandingPreview } from './LandingPreview';
import { SectionPanel } from './SectionPanel';
import type { LandingPageConfig, PageSection, BrandColors, SectionType, PageRecord } from './types';
import {
  createDefaultConfig,
  DEFAULT_HERO_DATA,
  DEFAULT_FEATURES_DATA,
  DEFAULT_CTA_DATA,
} from './types';
import { useSessionStore } from '@/lib/store/dashboard';
import { getCurrentUser } from '@/lib/utils/rbac';

// ─── Section add menu ────────────────────────────────────────────────────────

const AVAILABLE_SECTIONS: { type: SectionType; label: string; icon: string }[] = [
  { type: 'hero', label: 'Hero Banner', icon: '🖼️' },
  { type: 'features', label: 'Características', icon: '⭐' },
  { type: 'cta', label: 'Llamada a la acción', icon: '🎯' },
  { type: 'gallery', label: 'Galería', icon: '📷' },
  { type: 'testimonials', label: 'Testimonios', icon: '💬' },
  { type: 'contact', label: 'Contacto', icon: '📬' },
];

const DEFAULT_SECTION_DATA: Record<SectionType, PageSection['data']> = {
  hero: { ...DEFAULT_HERO_DATA },
  features: { ...DEFAULT_FEATURES_DATA },
  cta: { ...DEFAULT_CTA_DATA },
  gallery: { title: 'Galería', images: [], columns: 3 },
  testimonials: { title: 'Lo que dicen nuestros clientes', items: [] },
  contact: {
    title: 'Contáctanos',
    subtitle: '',
    email: '',
    phone: '',
    address: '',
    showMap: false,
  },
};

// ─── Color Picker Row ─────────────────────────────────────────────────────────

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded border border-gray-700 cursor-pointer bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}

// ─── Main LandingEditor ───────────────────────────────────────────────────────

type LeftTab = 'sections' | 'colors' | 'settings';
type PreviewMode = 'desktop' | 'mobile';

export default function LandingEditor() {
  const user = useMemo(() => getCurrentUser(), []);
  const storeId = user?.storeId;
  const restaurantId = user?.restaurantId;
  const serviceProviderId = user?.serviceProviderId;
  const { currentStore } = useSessionStore();
  const customDomain = currentStore?.subdomain
    ? `${currentStore.subdomain}.emprendyup.com`
    : undefined;

  const [config, setConfig] = useState<LandingPageConfig>(createDefaultConfig());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['hero-1']));
  const [leftTab, setLeftTab] = useState<LeftTab>('sections');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [pageRecord, setPageRecord] = useState<PageRecord | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // ── Fetch store + pages by custom domain ──────────────────────────────────
  const { data: storeByDomainData, loading: pageLoading } = useQuery(GET_STORE_BY_CUSTOM_DOMAIN, {
    variables: { customDomain: customDomain! },
    skip: !customDomain,
    errorPolicy: 'ignore',
  });
  console.log('🚀 ~ LandingEditor ~ storeByDomainData:', storeByDomainData);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const [saveDraftMutation, { loading: savingDraft }] = useMutation(SAVE_PAGE_DRAFT, {
    errorPolicy: 'all',
  });
  const [publishMutation, { loading: publishing }] = useMutation(PUBLISH_PAGE, {
    errorPolicy: 'all',
  });

  // ── Seed from store-by-domain page data ───────────────────────────────────
  useEffect(() => {
    const store = storeByDomainData?.storeByCustomDomain;
    if (!store?.pages?.length) return;

    // Find the first page (or the one matching the current entity type)
    const page = store.pages[0];
    const workingConfig: LandingPageConfig | null =
      page.draftConfig ?? page.publishedConfig ?? null;

    if (workingConfig) {
      setConfig(workingConfig);

      // Auto-expand the first section in the side nav
      if (workingConfig.sections?.length) {
        setExpandedSections(new Set([workingConfig.sections[0].id]));
      }
    }

    // Build a lightweight page record for status tracking
    const hasDraft = !!page.draftConfig;
    const hasPublished = !!page.publishedConfig;
    setPageRecord({
      id: store.id,
      status: hasPublished && !hasDraft ? 'published' : 'draft',
      publishedConfig: page.publishedConfig ?? null,
      draftConfig: page.draftConfig ?? null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }, [storeByDomainData]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const markDirty = () => setHasUnsavedChanges(true);

  const updateConfig = useCallback((patch: Partial<LandingPageConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    markDirty();
  }, []);

  const updateColors = useCallback((patch: Partial<BrandColors>) => {
    setConfig((prev) => ({ ...prev, colors: { ...prev.colors, ...patch } }));
    markDirty();
  }, []);

  const updateSection = useCallback((id: string, data: PageSection['data']) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, data } : s)),
    }));
    markDirty();
  }, []);

  const toggleSectionEnabled = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }));
    markDirty();
  }, []);

  const removeSection = useCallback((id: string) => {
    setConfig((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));
    markDirty();
  }, []);

  const moveSection = useCallback((id: string, dir: 'up' | 'down') => {
    setConfig((prev) => {
      const arr = [...prev.sections];
      const idx = arr.findIndex((s) => s.id === id);
      if (dir === 'up' && idx > 0) [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      if (dir === 'down' && idx < arr.length - 1)
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return { ...prev, sections: arr };
    });
    markDirty();
  }, []);

  const addSection = useCallback((type: SectionType) => {
    const newSection: PageSection = {
      id: `${type}-${Date.now()}`,
      type,
      enabled: true,
      data: { ...DEFAULT_SECTION_DATA[type] },
    };
    setConfig((prev) => ({ ...prev, sections: [...prev.sections, newSection] }));
    setExpandedSections((prev) => new Set(prev).add(newSection.id));
    setShowAddMenu(false);
    markDirty();
  }, []);

  const handleSaveDraft = async () => {
    try {
      const { data, errors } = await saveDraftMutation({
        variables: { storeId, restaurantId, serviceProviderId, config },
      });
      if (errors?.length) throw new Error(errors[0].message);
      if (data?.saveDraft) setPageRecord(data.saveDraft as PageRecord);
      setHasUnsavedChanges(false);
      toast.success('Borrador guardado');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar borrador';
      // If endpoint doesn't exist yet, save to localStorage as fallback
      localStorage.setItem('landing_draft', JSON.stringify(config));
      setHasUnsavedChanges(false);
      toast.success('Borrador guardado localmente');
      console.warn('Landing draft API not available, saved to localStorage:', msg);
    }
  };

  const handlePublish = async () => {
    try {
      const { data, errors } = await publishMutation({
        variables: { storeId, restaurantId, serviceProviderId },
      });
      if (errors?.length) throw new Error(errors[0].message);
      if (data?.publishPage) setPageRecord(data.publishPage as PageRecord);
      setHasUnsavedChanges(false);
      toast.success('¡Landing page publicada!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al publicar';
      toast.error(msg);
    }
  };

  const handlePreview = () => {
    const encoded = encodeURIComponent(JSON.stringify(config));
    window.open(`/dashboard/landing-editor/preview?config=${encoded}`, '_blank');
  };

  const toggleSection = (id: string) =>
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const isPublished = pageRecord?.status === 'published';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* ── HEADER ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 z-10">
        <div className="flex items-center gap-3">
          <Layers size={18} className="text-blue-400" />
          <div>
            <h1 className="text-sm font-semibold text-white leading-tight">
              Editor de Landing Page
            </h1>
            <p className="text-xs text-gray-500 leading-tight">
              {config.businessName || 'Mi negocio'} ·{' '}
              {isPublished ? (
                <span className="text-green-400">Publicada</span>
              ) : (
                <span className="text-amber-400">Borrador</span>
              )}
              {hasUnsavedChanges && <span className="text-orange-400 ml-1">· Sin guardar</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview mode toggle */}
          <div className="flex items-center bg-gray-800 rounded-lg p-0.5 mr-2">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1 transition-colors ${previewMode === 'desktop' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Monitor size={13} /> Desktop
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1 transition-colors ${previewMode === 'mobile' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Smartphone size={13} /> Móvil
            </button>
          </div>

          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
          >
            <Eye size={14} /> Ver preview
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
          >
            {savingDraft ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar borrador
          </button>

          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {publishing ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
            Publicar
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 min-h-0">
        {/* ── LEFT PANEL ── */}
        <aside className="w-80 flex-shrink-0 flex flex-col bg-gray-900 border-r border-gray-800 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-800">
            {(
              [
                { key: 'sections', label: 'Secciones', icon: <Layers size={13} /> },
                { key: 'colors', label: 'Colores', icon: <Palette size={13} /> },
                { key: 'settings', label: 'Ajustes', icon: <Globe size={13} /> },
              ] as { key: LeftTab; label: string; icon: React.ReactNode }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setLeftTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs transition-colors border-b-2 ${leftTab === tab.key ? 'border-blue-500 text-blue-400 bg-gray-800' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* ── SECTIONS TAB ── */}
            {leftTab === 'sections' && (
              <div className="space-y-2">
                {config.sections.map((section, idx) => (
                  <SectionPanel
                    key={section.id}
                    section={section}
                    isExpanded={expandedSections.has(section.id)}
                    colors={config.colors}
                    onToggleExpand={() => toggleSection(section.id)}
                    onToggleEnabled={() => toggleSectionEnabled(section.id)}
                    onUpdate={(data) => updateSection(section.id, data)}
                    onMoveUp={() => moveSection(section.id, 'up')}
                    onMoveDown={() => moveSection(section.id, 'down')}
                    onRemove={() => removeSection(section.id)}
                    isFirst={idx === 0}
                    isLast={idx === config.sections.length - 1}
                  />
                ))}

                {/* Add section */}
                <div className="relative">
                  <button
                    onClick={() => setShowAddMenu((v) => !v)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-gray-700 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors mt-2"
                  >
                    <Plus size={13} /> Agregar sección
                  </button>
                  {showAddMenu && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                        <span className="text-xs font-medium text-gray-300">
                          Selecciona una sección
                        </span>
                        <button
                          onClick={() => setShowAddMenu(false)}
                          className="text-gray-500 hover:text-gray-300"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      {AVAILABLE_SECTIONS.map((s) => (
                        <button
                          key={s.type}
                          onClick={() => addSection(s.type)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors text-left"
                        >
                          <span className="text-base">{s.icon}</span> {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── COLORS TAB ── */}
            {leftTab === 'colors' && (
              <div>
                <p className="text-xs text-gray-500 mb-3">
                  Los colores base se sincronizan desde la configuración de tu negocio. Puedes
                  personalizarlos aquí para el landing.
                </p>
                <ColorRow
                  label="Color primario"
                  value={config.colors.primaryColor}
                  onChange={(v) => updateColors({ primaryColor: v })}
                />
                <ColorRow
                  label="Color secundario"
                  value={config.colors.secondaryColor}
                  onChange={(v) => updateColors({ secondaryColor: v })}
                />
                <ColorRow
                  label="Color acento"
                  value={config.colors.accentColor}
                  onChange={(v) => updateColors({ accentColor: v })}
                />
                <ColorRow
                  label="Fondo"
                  value={config.colors.backgroundColor}
                  onChange={(v) => updateColors({ backgroundColor: v })}
                />
                <ColorRow
                  label="Botones"
                  value={config.colors.buttonColor}
                  onChange={(v) => updateColors({ buttonColor: v })}
                />
                <ColorRow
                  label="Texto"
                  value={config.colors.textColor}
                  onChange={(v) => updateColors({ textColor: v })}
                />

                <div className="mt-4 p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Vista previa de paleta</p>
                  <div className="flex gap-2">
                    {Object.values(config.colors).map((c, i) => (
                      <div
                        key={i}
                        className="flex-1 h-8 rounded"
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SETTINGS TAB ── */}
            {leftTab === 'settings' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Nombre del negocio
                  </label>
                  <input
                    className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    value={config.businessName}
                    onChange={(e) => updateConfig({ businessName: e.target.value })}
                    placeholder="Mi tienda"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    URL del logo
                  </label>
                  <input
                    className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    value={config.logoUrl}
                    onChange={(e) => updateConfig({ logoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                  {config.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={config.logoUrl}
                      alt="logo"
                      className="mt-2 h-10 object-contain rounded border border-gray-700 p-1"
                    />
                  )}
                </div>

                {pageRecord && (
                  <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-lg space-y-1.5">
                    <div className="flex items-center gap-2">
                      {isPublished ? (
                        <CheckCircle size={13} className="text-green-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle size={13} className="text-amber-400 flex-shrink-0" />
                      )}
                      <span className="text-xs text-gray-300">
                        Estado:{' '}
                        <strong className={isPublished ? 'text-green-400' : 'text-amber-400'}>
                          {isPublished ? 'Publicada' : 'Borrador'}
                        </strong>
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Actualizado: {new Date(pageRecord.updatedAt).toLocaleString('es-CO')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ── PREVIEW PANEL ── */}
        <main className="flex-1 min-w-0 bg-gray-950 overflow-auto flex items-start justify-center p-6">
          {pageLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw size={24} className="animate-spin text-blue-400 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Cargando configuración...</p>
              </div>
            </div>
          ) : (
            <div
              className="bg-white shadow-2xl ring-1 ring-gray-800 overflow-hidden transition-all duration-300"
              style={{
                width: previewMode === 'mobile' ? '390px' : '100%',
                maxWidth: previewMode === 'mobile' ? '390px' : '1280px',
                minHeight: '600px',
                borderRadius: previewMode === 'mobile' ? '24px' : '8px',
              }}
            >
              <LandingPreview config={config} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
