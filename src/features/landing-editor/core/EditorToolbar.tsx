'use client';

// ─── EditorToolbar ─────────────────────────────────────────────────────────────
// Barra superior del editor con:
//   - Undo / Redo  (Craft.js actions.history)
//   - Toggle Desktop / Mobile viewport
//   - Botón "Guardar borrador"
//   - Botón "Publicar"
//   - Indicador de último guardado y errores
//
// Lee tenant, seo y theme del LandingEditorContext.
// Llama a useLandingPersistence para save/publish.

import { useEditor } from '@craftjs/core';
import { useEffect } from 'react';
import { useLandingEditor } from '../context/LandingEditorContext';
import { useLandingPersistence } from '../hooks/useLandingPersistence';

// ─── Icons (inline SVG para no añadir dependencias) ───────────────────────────

function IconUndo() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14 4 9l5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

function IconRedo() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 14 5-5-5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9H8.5a5.5 5.5 0 0 0 0 11H13" />
    </svg>
  );
}

function IconDesktop() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path strokeLinecap="round" d="M8 21h8M12 17v4" />
    </svg>
  );
}

function IconMobile() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path strokeLinecap="round" d="M12 18h.01" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
      />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

export function EditorToolbar() {
  const { tenant, seo, theme, viewport, setViewport } = useLandingEditor();

  const { canUndo, canRedo, actions } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  const { saveDraft, publish, isSaving, isPublishing, lastSaved, error } = useLandingPersistence({
    tenant,
    seo,
    theme,
  });

  // Keyboard shortcuts: Cmd/Ctrl+S → save, Cmd/Ctrl+Z → undo, Cmd/Ctrl+Shift+Z → redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        if (!isSaving && !isPublishing) void saveDraft();
      }
      if (mod && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canUndo) actions.history.undo();
      }
      if (mod && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo) actions.history.redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSaving, isPublishing, saveDraft, canUndo, canRedo, actions]);

  const formattedSave = lastSaved
    ? lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="h-12 shrink-0 bg-gray-900 border-b border-gray-700 flex items-center px-3 gap-1">
      {/* Tenant name */}
      <span className="text-gray-300 text-sm font-medium mr-2 truncate max-w-[140px]">
        {tenant.name}
      </span>

      <div className="w-px h-5 bg-gray-700 mx-1" />

      {/* Undo / Redo */}
      <button
        onClick={() => actions.history.undo()}
        disabled={!canUndo}
        title="Deshacer (⌘Z)"
        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <IconUndo />
      </button>
      <button
        onClick={() => actions.history.redo()}
        disabled={!canRedo}
        title="Rehacer (⌘⇧Z)"
        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <IconRedo />
      </button>

      <div className="w-px h-5 bg-gray-700 mx-1" />

      {/* Viewport toggle */}
      <div className="flex bg-gray-800 rounded-md p-0.5 gap-0.5">
        <button
          onClick={() => setViewport('desktop')}
          title="Vista escritorio"
          className={`p-1.5 rounded transition-colors ${
            viewport === 'desktop' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <IconDesktop />
        </button>
        <button
          onClick={() => setViewport('mobile')}
          title="Vista móvil"
          className={`p-1.5 rounded transition-colors ${
            viewport === 'mobile' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <IconMobile />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status */}
      <div className="flex items-center gap-2 mr-2">
        {error && (
          <span className="text-red-400 text-xs truncate max-w-[180px]" title={error}>
            ⚠ {error}
          </span>
        )}
        {!error && formattedSave && (
          <span className="text-gray-500 text-xs">Guardado {formattedSave}</span>
        )}
      </div>

      {/* Preview link */}
      {(() => {
        const domain = tenant.customDomain
          ? `https://${tenant.customDomain}`
          : `https://${tenant.slug}.emprendyup.com`;
        return (
          <a
            href={domain}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                       bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
            title={domain}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
              />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Ver sitio
          </a>
        );
      })()}

      {/* Save draft */}
      <button
        onClick={() => {
          void saveDraft();
        }}
        disabled={isSaving || isPublishing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                   bg-gray-700 text-gray-200 hover:bg-gray-600
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? <Spinner /> : <IconSave />}
        {isSaving ? 'Guardando…' : 'Guardar'}
      </button>

      {/* Publish */}
      <button
        onClick={() => {
          void publish();
        }}
        disabled={isSaving || isPublishing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold
                   bg-indigo-600 text-white hover:bg-indigo-500
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPublishing ? <Spinner /> : null}
        {isPublishing ? 'Publicando…' : 'Publicar'}
      </button>
    </header>
  );
}
