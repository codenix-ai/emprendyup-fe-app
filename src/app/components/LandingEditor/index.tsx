'use client';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { GET_PAGES, SAVE_PAGE } from '@/lib/graphql/queries';

const GET_STORE_DOMAIN = gql`
  query GetStoreDomainLE($storeId: String!) {
    store(storeId: $storeId) {
      storeId
      customDomain
    }
  }
`;

const GET_RESTAURANT_DOMAIN = gql`
  query GetRestaurantDomainLE($id: ID!) {
    restaurant(id: $id) {
      id
      customDomain
      slug
    }
  }
`;

const GET_SERVICE_DOMAIN = gql`
  query GetServiceDomainLE($id: String!) {
    serviceProvider(id: $id) {
      id
      customDomain
      slug
    }
  }
`;
import {
  Save,
  Globe,
  Eye,
  Palette,
  Layers,
  AlertCircle,
  Monitor,
  Smartphone,
  RefreshCw,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LandingPreview } from './LandingPreview';
import { DraftSectionPanel } from './DraftSectionPanel';
import type { DraftConfig, BrandColors, PageRecord } from './types';
import { createDefaultDraftConfig, extractColors, DRAFT_SECTION_META } from './types';
import { getCurrentUser } from '@/lib/utils/rbac';

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
  const router = useRouter();
  const user = useMemo(() => getCurrentUser(), []);
  const storeId = user?.storeId;
  const restaurantId = user?.restaurantId;
  const serviceProviderId = user?.serviceProviderId;

  const [draftConfig, setDraftConfig] = useState<DraftConfig>(createDefaultDraftConfig());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['hero']));
  const [leftTab, setLeftTab] = useState<LeftTab>('sections');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [pageRecord, setPageRecord] = useState<PageRecord | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Section ordering state (user can reorder sections)
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const knownOrder = Object.keys(DRAFT_SECTION_META);
    const configKeys = Object.keys(createDefaultDraftConfig());
    const ordered = knownOrder.filter((k) => configKeys.includes(k));
    const extra = configKeys.filter((k) => !knownOrder.includes(k));
    return [...ordered, ...extra];
  });

  // Derived: brand colors for the color picker and preview
  const colors = useMemo(() => extractColors(draftConfig), [draftConfig]);

  // ── Fetch custom domain by entity type ───────────────────────────────────
  const { data: storeData } = useQuery(GET_STORE_DOMAIN, {
    variables: { storeId },
    skip: !storeId,
    errorPolicy: 'ignore',
  });
  const { data: restaurantData } = useQuery(GET_RESTAURANT_DOMAIN, {
    variables: { id: restaurantId },
    skip: !restaurantId,
    errorPolicy: 'ignore',
  });
  const { data: serviceData } = useQuery(GET_SERVICE_DOMAIN, {
    variables: { id: serviceProviderId },
    skip: !serviceProviderId,
    errorPolicy: 'ignore',
  });

  const customDomain = useMemo(() => {
    if (storeData?.store) {
      const s = storeData.store;
      return s.customDomain ? `https://${s.customDomain}` : `https://${s.storeId}.emprendyup.com`;
    }
    if (restaurantData?.restaurant) {
      const r = restaurantData.restaurant;
      return r.customDomain
        ? `https://${r.customDomain}`
        : r.slug
          ? `https://${r.slug}.emprendyup.com`
          : null;
    }
    if (serviceData?.serviceProvider) {
      const sp = serviceData.serviceProvider;
      return sp.customDomain
        ? `https://${sp.customDomain}`
        : sp.slug
          ? `https://${sp.slug}.emprendyup.com`
          : null;
    }
    return null;
  }, [storeData, restaurantData, serviceData]);

  // ── Fetch pages by entity type ────────────────────────────────────────────
  const { data: pagesData, loading: pageLoading } = useQuery(GET_PAGES, {
    variables: {
      ...(storeId && { storeId }),
      ...(restaurantId && { restaurantId }),
      ...(serviceProviderId && { serviceProviderId }),
    },
    skip: !storeId && !restaurantId && !serviceProviderId,
    errorPolicy: 'ignore',
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const [savePageMutation, { loading: savingDraft }] = useMutation(SAVE_PAGE, {
    errorPolicy: 'all',
  });
  const publishing = savingDraft;

  // ── Seed from pages query data ────────────────────────────────────────────
  useEffect(() => {
    const pages = pagesData?.pages;
    if (!pages?.length) return;

    const page = pages[0];
    const rawConfig = page.draftConfig ?? page.publishedConfig ?? null;

    if (rawConfig && typeof rawConfig === 'object') {
      // Merge with defaults so sections absent from the API response (e.g. `about`)
      // still appear in the editor and preview.
      const merged: DraftConfig = { ...createDefaultDraftConfig() };
      for (const [k, v] of Object.entries(rawConfig as DraftConfig)) {
        if (v !== null && v !== undefined) merged[k] = v;
      }
      setDraftConfig(merged);
      // Initialize section order from the loaded config
      const knownOrder = Object.keys(DRAFT_SECTION_META);
      const configKeys = Object.keys(merged);
      const ordered = knownOrder.filter((k) => configKeys.includes(k));
      const extra = configKeys.filter((k) => !knownOrder.includes(k));
      setSectionOrder([...ordered, ...extra]);
      // Auto-expand the first section
      const firstKey = Object.keys(rawConfig)[0];
      if (firstKey) setExpandedSections(new Set([firstKey]));
    }

    const hasDraft = !!page.draftConfig;
    const hasPublished = !!page.publishedConfig;
    setPageRecord({
      id: page.id,
      status: hasPublished && !hasDraft ? 'published' : 'draft',
      publishedConfig: page.publishedConfig ?? null,
      draftConfig: page.draftConfig ?? null,
      updatedAt: page.updatedAt ?? new Date().toISOString(),
      createdAt: page.createdAt ?? new Date().toISOString(),
    });
  }, [pagesData]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const markDirty = () => setHasUnsavedChanges(true);

  const updateSection = useCallback((key: string, data: Record<string, unknown>) => {
    setDraftConfig((prev) => ({ ...prev, [key]: data }));
    markDirty();
  }, []);

  const updateThemeColor = useCallback((colorKey: string, value: string) => {
    setDraftConfig((prev) => ({
      ...prev,
      theme: {
        ...((prev.theme ?? {}) as Record<string, unknown>),
        colors: {
          ...((prev.theme?.colors ?? {}) as Record<string, string>),
          [colorKey]: value,
        },
      },
    }));
    markDirty();
  }, []);

  const updateBranding = useCallback((patch: Record<string, unknown>) => {
    setDraftConfig((prev) => ({
      ...prev,
      branding: { ...((prev.branding ?? {}) as Record<string, unknown>), ...patch },
    }));
    markDirty();
  }, []);

  const updateSeo = useCallback((patch: Record<string, unknown>) => {
    setDraftConfig((prev) => ({
      ...prev,
      seo: { ...((prev.seo ?? {}) as Record<string, unknown>), ...patch },
    }));
    markDirty();
  }, []);

  const handleSaveDraft = async () => {
    try {
      const { data, errors } = await savePageMutation({
        variables: {
          input: {
            slug: 'home',
            ...(storeId && { storeId }),
            ...(restaurantId && { restaurantId }),
            ...(serviceProviderId && { serviceProviderId }),
            draftConfig,
          },
        },
      });
      if (errors?.length) throw new Error(errors[0].message);
      if (data?.savePage) setPageRecord(data.savePage as PageRecord);
      setHasUnsavedChanges(false);
      toast.success('Borrador guardado');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar borrador';
      localStorage.setItem('landing_draft', JSON.stringify(draftConfig));
      setHasUnsavedChanges(false);
      toast.success('Borrador guardado localmente');
      console.warn('Landing savePage not available, saved to localStorage:', msg);
    }
  };

  const handlePublish = async () => {
    try {
      const { data, errors } = await savePageMutation({
        variables: {
          input: {
            slug: 'home',
            ...(storeId && { storeId }),
            ...(restaurantId && { restaurantId }),
            ...(serviceProviderId && { serviceProviderId }),
            draftConfig,
            publishedConfig: draftConfig,
          },
        },
      });
      if (errors?.length) throw new Error(errors[0].message);
      if (data?.savePage) setPageRecord(data.savePage as PageRecord);
      setHasUnsavedChanges(false);
      toast.success('¡Landing page publicada!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al publicar';
      toast.error(msg);
    }
  };

  const handlePreview = () => {
    if (customDomain) {
      window.open(customDomain, '_blank');
    } else {
      const encoded = encodeURIComponent(JSON.stringify(draftConfig));
      window.open(`/dashboard/landing-editor/preview?config=${encoded}`, '_blank');
    }
  };

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const moveSection = useCallback((key: string, dir: 'up' | 'down') => {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const next = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
    markDirty();
  }, []);

  const isPublished = pageRecord?.status === 'published';
  const businessName =
    ((draftConfig.branding as Record<string, unknown> | undefined)?.name as string) ?? '';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* ── HEADER ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-xs"
            title="Volver al dashboard"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <Layers size={18} className="text-blue-400" />
          <div>
            <h1 className="text-sm font-semibold text-white leading-tight">
              Editor de Landing Page
            </h1>
            <p className="text-xs text-gray-500 leading-tight">
              {businessName || 'Mi negocio'} ·{' '}
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
                {sectionOrder.map((key, idx) => {
                  const sectionData = draftConfig[key];
                  if (sectionData === null || sectionData === undefined) return null;
                  const data =
                    typeof sectionData === 'object' && !Array.isArray(sectionData)
                      ? (sectionData as Record<string, unknown>)
                      : { value: sectionData };
                  return (
                    <DraftSectionPanel
                      key={key}
                      sectionKey={key}
                      data={data}
                      isExpanded={expandedSections.has(key)}
                      onToggleExpand={() => toggleSection(key)}
                      onUpdate={(next) => updateSection(key, next)}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < sectionOrder.length - 1}
                      onMoveUp={() => moveSection(key, 'up')}
                      onMoveDown={() => moveSection(key, 'down')}
                    />
                  );
                })}
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
                  value={colors.primaryColor}
                  onChange={(v) => updateThemeColor('primaryColor', v)}
                />
                <ColorRow
                  label="Color secundario"
                  value={colors.secondaryColor}
                  onChange={(v) => updateThemeColor('secondaryColor', v)}
                />
                <ColorRow
                  label="Color acento"
                  value={colors.accentColor}
                  onChange={(v) => updateThemeColor('accentColor', v)}
                />
                <ColorRow
                  label="Fondo"
                  value={colors.backgroundColor}
                  onChange={(v) => updateThemeColor('backgroundColor', v)}
                />
                <ColorRow
                  label="Botones"
                  value={colors.buttonColor}
                  onChange={(v) => updateThemeColor('buttonColor', v)}
                />
                <ColorRow
                  label="Texto"
                  value={colors.textColor}
                  onChange={(v) => updateThemeColor('textColor', v)}
                />

                <div className="mt-4 p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Vista previa de paleta</p>
                  <div className="flex gap-2">
                    {Object.values(colors).map((c, i) => (
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
                    value={businessName}
                    onChange={(e) => updateBranding({ name: e.target.value })}
                    placeholder="Mi tienda"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Logo</label>
                  <input
                    className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    value={
                      typeof draftConfig.branding?.logo === 'string'
                        ? draftConfig.branding.logo
                        : (((draftConfig.branding?.logo as Record<string, unknown> | undefined)
                            ?.url as string) ?? '')
                    }
                    onChange={(e) => updateBranding({ logo: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    SEO — Título
                  </label>
                  <input
                    className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    value={(draftConfig.seo?.title as string) ?? ''}
                    onChange={(e) => updateSeo({ title: e.target.value })}
                    placeholder="Título para buscadores"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    SEO — Descripción
                  </label>
                  <textarea
                    className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    value={(draftConfig.seo?.description as string) ?? ''}
                    onChange={(e) => updateSeo({ description: e.target.value })}
                    placeholder="Descripción para buscadores"
                  />
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
              <LandingPreview config={draftConfig} sectionOrder={sectionOrder} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
