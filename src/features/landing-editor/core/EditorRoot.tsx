'use client';

// ─── EditorRoot ────────────────────────────────────────────────────────────────
// Componente raíz del editor de landing pages.
// Envuelve todo en <Editor> de Craft.js y compone los panels.
//
// ⚠️  DEBE estar dentro de <ApolloProvider> (ya presente en el layout del dashboard).
// ⚠️  DEBE tener "use client" — Craft.js es 100% client-side.

import { useState } from 'react';
import { Editor } from '@craftjs/core';
import { BLOCK_REGISTRY } from '../blocks';
import { ToolboxPanel } from '../panels/ToolboxPanel';
import { PropertiesPanel } from '../panels/PropertiesPanel';
import { AIAssistantPanel } from '../panels/AIAssistantPanel';
import { ThemeSelector } from '../panels/ThemeSelector';
import { EditorCanvas } from './EditorCanvas';
import { EditorToolbar } from './EditorToolbar';
import { LandingEditorProvider, useLandingEditor } from '../context/LandingEditorContext';
import { ThemeProvider } from '../theme/ThemeProvider';
import type { TenantContext } from '../context/TenantContext';
import type { LandingPageJSON } from '@/lib/landing-renderer/types/landing-json.schema';

// ─── Tab types ────────────────────────────────────────────────────────────────

type RightPanelTab = 'properties' | 'theme' | 'ai';

const TAB_LABELS: Record<RightPanelTab, string> = {
  properties: 'Propiedades',
  theme: 'Tema',
  ai: '✨ IA',
};

const RIGHT_PANEL_TABS: RightPanelTab[] = ['properties', 'theme', 'ai'];

// ─── Inner layout (needs context) ─────────────────────────────────────────────

interface EditorLayoutProps {
  craftStateStr: string | undefined;
  tenant: TenantContext;
}

function EditorLayout({ craftStateStr, tenant }: EditorLayoutProps) {
  const { theme, viewport } = useLandingEditor();
  const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');
  const isMobile = viewport === 'mobile';

  return (
    // ThemeProvider FUERA de <Editor> para evitar colisión de contextos
    // durante la inicialización de Craft.js (setState-in-render)
    <ThemeProvider theme={theme}>
      <Editor resolver={BLOCK_REGISTRY} enabled={true}>
        <div className="flex h-screen w-full overflow-hidden bg-gray-950">
          {/* Panel izquierdo: biblioteca de bloques arrastrables */}
          <ToolboxPanel tenantType={tenant.type} />

          {/* Centro: toolbar + canvas drag & drop */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <EditorToolbar />
            <EditorCanvas initialJSON={craftStateStr} isMobile={isMobile} />
          </div>

          {/* Panel derecho: propiedades + selector de tema + IA */}
          <div className="flex w-72 flex-col overflow-hidden border-l border-gray-800 bg-gray-900">
            {/* Tab bar */}
            <div
              className="flex border-b border-gray-700"
              role="tablist"
              aria-label="Panel derecho"
            >
              {RIGHT_PANEL_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  aria-controls={`right-panel-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    'flex-1 py-2.5 text-xs font-medium transition-colors duration-150',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500',
                    activeTab === tab
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800',
                  ].join(' ')}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div
              id="right-panel-properties"
              role="tabpanel"
              aria-labelledby="tab-properties"
              hidden={activeTab !== 'properties'}
              className="flex-1 overflow-y-auto"
            >
              <PropertiesPanel />
            </div>

            <div
              id="right-panel-theme"
              role="tabpanel"
              aria-labelledby="tab-theme"
              hidden={activeTab !== 'theme'}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <ThemeSelector />
            </div>

            <div
              id="right-panel-ai"
              role="tabpanel"
              aria-labelledby="tab-ai"
              hidden={activeTab !== 'ai'}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <AIAssistantPanel tenant={tenant} />
            </div>
          </div>
        </div>
      </Editor>
    </ThemeProvider>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

interface EditorRootProps {
  tenant: TenantContext;
  /** Full LandingPageJSON loaded from the backend (draft or published) */
  initialJSON?: LandingPageJSON;
}

export function EditorRoot({ tenant, initialJSON }: EditorRootProps) {
  // Serialize craftState to the string format Craft.js Frame expects.
  // Skip when craftState is empty (new page or V1 migration with no craft data).
  const craftStateStr =
    initialJSON?.craftState && Object.keys(initialJSON.craftState).length > 0
      ? JSON.stringify(initialJSON.craftState)
      : undefined;

  return (
    <LandingEditorProvider
      tenant={tenant}
      initialSeo={initialJSON?.seo}
      initialTheme={initialJSON?.theme}
    >
      <EditorLayout craftStateStr={craftStateStr} tenant={tenant} />
    </LandingEditorProvider>
  );
}
