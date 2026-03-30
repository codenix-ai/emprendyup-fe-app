# PLAN: Visual Landing Page Editor con Craft.js + IA

**Proyecto:** EmprendYup — Multitenant Landing Page Editor  
**Stack base:** Next.js 15 (App Router) · TypeScript · Tailwind CSS  
**Editor elegido:** Craft.js v0.9+  
**Versión del plan:** 1.0  
**Fecha:** 2026-03-29

---

## 0. Decisión Técnica: Craft.js sobre GrapesJS

| Criterio                 | GrapesJS                                     | **Craft.js ✅**                         |
| ------------------------ | -------------------------------------------- | --------------------------------------- |
| Compatibilidad React 18+ | ❌ Manipula DOM directo, conflictos con VDOM | ✅ 100% React, hooks nativos            |
| Next.js 15 App Router    | ❌ Requiere `dynamic import` + patches       | ✅ Funciona out-of-the-box              |
| SSR / SSG                | ❌ Solo client-side                          | ✅ Componentes son React estándar       |
| Tailwind CSS             | ❌ Genera clases CSS propias                 | ✅ Usa tus clases Tailwind directamente |
| JSON output              | ⚠️ Formato GrapesJS propietario              | ✅ JSON completamente controlado        |
| Curva de aprendizaje     | Alta (API jQuery-like)                       | Media (React hooks)                     |
| Tamaño bundle            | ~350KB gzip                                  | ~45KB gzip                              |
| Comunidad activa 2025    | Moderada                                     | Alta (React ecosystem)                  |

**Conclusión:** Craft.js produce el JSON que tú defines, con los componentes React que tú ya tienes, sin romper Tailwind ni App Router.

---

## 1. Visión General del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│              app.emprendy.ai (Dashboard - Next.js 15)       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CRAFT.JS EDITOR                        │   │
│  │  ┌──────────┐  ┌─────────────┐  ┌───────────────┐  │   │
│  │  │ToolboxPanel│ │   Canvas    │  │ PropertiesPanel│ │   │
│  │  │ (bloques) │  │ (drag&drop) │  │ (edición props)│ │   │
│  │  └──────────┘  └─────────────┘  └───────────────┘  │   │
│  │                        +                            │   │
│  │              ┌──────────────────┐                   │   │
│  │              │   AI Assistant   │                   │   │
│  │              │ (generación JSON)│                   │   │
│  │              └──────────────────┘                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓ serialize()                      │
│              ┌───────────────────────────┐                  │
│              │  LandingPageJSON (DB)     │                  │
│              │  Supabase / API REST      │                  │
│              └───────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                              ↓ GET /api/landing/{tenantSlug}
┌─────────────────────────────────────────────────────────────┐
│         {tenant}.emprendyup.com (Renderer - Next.js)        │
│                                                             │
│   LandingRenderer({ json }) → mapea blocks[] → React       │
│   Mismos componentes, modo read-only, ISR cada 60s          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Estructura de Archivos a Crear

```
apps/
└── dashboard/
    └── src/
        ├── app/
        │   └── dashboard/
        │       └── landing-editor/
        │           ├── page.tsx                    ← REEMPLAZAR completamente
        │           └── loading.tsx
        │
        └── features/
            └── landing-editor/
                ├── index.tsx                       ← Entry point del editor
                │
                ├── core/
                │   ├── EditorRoot.tsx              ← <Editor> de Craft.js + providers
                │   ├── EditorCanvas.tsx            ← <Frame> de Craft.js
                │   ├── EditorToolbar.tsx           ← Barra superior (save, publish, preview)
                │   └── useEditorSerializer.ts      ← Hook para serializar/deserializar JSON
                │
                ├── panels/
                │   ├── ToolboxPanel.tsx            ← Panel izquierdo: biblioteca de bloques
                │   ├── PropertiesPanel.tsx         ← Panel derecho: props del bloque seleccionado
                │   ├── LayersPanel.tsx             ← Panel de capas/orden de secciones
                │   └── AIAssistantPanel.tsx        ← Panel IA: generación y mejoras
                │
                ├── blocks/                         ← Bloques arrastrables (Craft nodes)
                │   ├── index.ts                    ← Exporta BLOCK_REGISTRY
                │   ├── HeroBanner/
                │   │   ├── HeroBanner.craft.tsx    ← Componente + craft config
                │   │   ├── HeroBanner.props.ts     ← Tipos de props
                │   │   ├── HeroBanner.settings.tsx ← Settings form en PropertiesPanel
                │   │   └── variants/
                │   │       ├── gradient-overlay.tsx
                │   │       ├── split-image.tsx
                │   │       └── minimal.tsx
                │   ├── ProductGrid/
                │   │   ├── ProductGrid.craft.tsx
                │   │   ├── ProductGrid.props.ts
                │   │   └── ProductGrid.settings.tsx
                │   ├── AboutSection/
                │   ├── TestimonialsSection/
                │   ├── ContactSection/
                │   ├── GallerySection/
                │   ├── NavigationBar/
                │   ├── FooterSection/
                │   ├── CTABanner/
                │   ├── BookingForm/
                │   └── BrandSection/
                │
                ├── theme/
                │   ├── ThemeProvider.tsx           ← Aplica CSS custom properties
                │   ├── ThemeSelector.tsx           ← UI para seleccionar preset
                │   ├── presets/
                │   │   ├── elegant-dark.ts
                │   │   ├── modern-light.ts
                │   │   ├── natural-earth.ts
                │   │   ├── bold-vibrant.ts
                │   │   └── minimal-mono.ts
                │   └── types.ts
                │
                ├── ai/
                │   ├── useAIGeneration.ts          ← Hook principal de IA
                │   ├── prompts/
                │   │   ├── generateLanding.ts      ← Prompt: genera JSON completo
                │   │   ├── improveCopy.ts          ← Prompt: mejora texto seleccionado
                │   │   └── suggestPalette.ts       ← Prompt: sugiere colores
                │   └── types.ts
                │
                ├── hooks/
                │   ├── useLandingDraft.ts          ← Guardar/cargar borrador
                │   ├── useLandingPublish.ts        ← Publicar landing
                │   └── useMultitenantTheme.ts      ← Cargar tema del tenant
                │
                └── types/
                    ├── landing-json.schema.ts      ← Schema TypeScript del JSON
                    └── craft-nodes.types.ts        ← Tipos Craft.js

packages/
└── landing-renderer/                               ← Paquete compartido
    ├── src/
    │   ├── LandingRenderer.tsx                     ← Componente principal renderer
    │   ├── blocks/                                 ← MISMOS componentes, sin craft config
    │   │   ├── HeroBanner.tsx
    │   │   ├── ProductGrid.tsx
    │   │   └── ... (todos los bloques)
    │   ├── theme/
    │   │   ├── ThemeProvider.tsx
    │   │   └── presets/ (mismo que dashboard)
    │   └── types/
    │       └── landing-json.schema.ts (compartido)
    └── package.json
```

---

## 3. Schema JSON del Landing Page (v2.0)

**Archivo:** `packages/landing-renderer/src/types/landing-json.schema.ts`

```typescript
export interface LandingPageJSON {
  version: '2.0';
  tenantId: string;
  tenantSlug: string;
  status: 'draft' | 'published';
  updatedAt: string;
  publishedAt?: string;

  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
  };

  theme: LandingTheme;

  // Craft.js serializa esto — NO modificar estructura interna
  craftState: CraftSerializedNodes; // ← lo que devuelve query.serialize()

  // Metadata legible para el renderer (extraída del craftState)
  blocks: LandingBlock[];
}

export interface LandingTheme {
  preset: ThemePreset;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  typography: {
    headingFont: string; // Google Font name
    bodyFont: string;
    scale: 'sm' | 'md' | 'lg' | 'xl';
  };
  spacing: 'compact' | 'normal' | 'relaxed';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadows: 'none' | 'subtle' | 'medium' | 'strong';
}

export type ThemePreset =
  | 'elegant-dark'
  | 'modern-light'
  | 'natural-earth'
  | 'bold-vibrant'
  | 'minimal-mono'
  | 'custom';

export interface LandingBlock {
  id: string;
  type: BlockType;
  variant: string;
  visible: boolean;
  order: number;
  props: Record<string, unknown>;
}

export type BlockType =
  | 'HeroBanner'
  | 'ProductGrid'
  | 'AboutSection'
  | 'TestimonialsSection'
  | 'ContactSection'
  | 'GallerySection'
  | 'NavigationBar'
  | 'FooterSection'
  | 'CTABanner'
  | 'BookingForm'
  | 'BrandSection'
  | 'CustomHTML'; // escape hatch para power users

// Craft.js internal state (opaque para el renderer)
export type CraftSerializedNodes = Record<
  string,
  {
    type: { resolvedName: string };
    props: Record<string, unknown>;
    parent?: string;
    nodes: string[];
    linkedNodes: Record<string, string>;
    displayName: string;
    custom: Record<string, unknown>;
    hidden: boolean;
    isCanvas: boolean;
  }
>;
```

---

## 4. Implementación de un Bloque Craft.js (Ejemplo: HeroBanner)

**Archivo:** `features/landing-editor/blocks/HeroBanner/HeroBanner.craft.tsx`

```typescript
"use client";

import { useNode, UserComponent } from "@craftjs/core";
import { HeroBannerSettings } from "./HeroBanner.settings";
import type { HeroBannerProps } from "./HeroBanner.props";

const VARIANTS = {
  "gradient-overlay": HeroBannerGradient,
  "split-image": HeroBannerSplit,
  "minimal": HeroBannerMinimal,
};

export const HeroBanner: UserComponent<HeroBannerProps> = (props) => {
  const { connectors: { connect, drag } } = useNode();
  const VariantComponent = VARIANTS[props.variant] ?? HeroBannerGradient;

  return (
    <section
      ref={(ref) => connect(drag(ref!))}
      data-block-type="HeroBanner"
      className="relative w-full cursor-move"
    >
      <VariantComponent {...props} />
    </section>
  );
};

// ← Craft.js lee esto para configurar el nodo
HeroBanner.craft = {
  displayName: "Hero Banner",
  props: {
    variant: "gradient-overlay",
    title: "Tu título aquí",
    subtitle: "Tu descripción aquí",
    backgroundImage: "",
    overlayOpacity: 0.4,
    overlayColor: "#000000",
    minHeight: "80vh",
    contentPosition: "center",
    textAlign: "center",
    cta: [{ text: "Ver más", href: "/products", variant: "primary" }],
    visible: true,
  } satisfies HeroBannerProps,
  related: {
    settings: HeroBannerSettings, // ← Se renderiza en PropertiesPanel
  },
  rules: {
    canDrag: () => true,
    canDrop: () => false,     // No puede recibir hijos
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
```

---

## 5. EditorRoot: Setup de Craft.js

**Archivo:** `features/landing-editor/core/EditorRoot.tsx`

```typescript
"use client";

import { Editor } from "@craftjs/core";
import { BLOCK_REGISTRY } from "../blocks";
import { ToolboxPanel } from "../panels/ToolboxPanel";
import { PropertiesPanel } from "../panels/PropertiesPanel";
import { EditorCanvas } from "./EditorCanvas";
import { EditorToolbar } from "./EditorToolbar";
import { AIAssistantPanel } from "../panels/AIAssistantPanel";

interface EditorRootProps {
  tenantId: string;
  initialJSON?: string; // craftState serializado
}

export function EditorRoot({ tenantId, initialJSON }: EditorRootProps) {
  return (
    <Editor
      resolver={BLOCK_REGISTRY}   // ← Mapa de todos los bloques disponibles
      enabled={true}
      onRender={({ render }) => render} // custom render si se necesita
    >
      <div className="flex h-screen w-full overflow-hidden bg-gray-950">
        {/* Panel izquierdo: biblioteca de bloques */}
        <ToolboxPanel />

        {/* Centro: Canvas drag & drop */}
        <div className="flex flex-1 flex-col">
          <EditorToolbar tenantId={tenantId} />
          <EditorCanvas initialJSON={initialJSON} />
        </div>

        {/* Panel derecho: propiedades del bloque seleccionado */}
        <PropertiesPanel />

        {/* Panel IA flotante */}
        <AIAssistantPanel tenantId={tenantId} />
      </div>
    </Editor>
  );
}
```

---

## 6. Serialización y Persistencia

**Archivo:** `features/landing-editor/hooks/useLandingDraft.ts`

```typescript
'use client';

import { useEditor } from '@craftjs/core';
import { useMutation, useQuery } from '@tanstack/react-query';

export function useLandingDraft(tenantId: string) {
  const { query, actions } = useEditor();

  // Guardar borrador
  const saveDraft = useMutation({
    mutationFn: async () => {
      const craftState = query.serialize(); // ← JSON de Craft.js
      const blocks = extractBlocksMetadata(query); // ← metadata legible

      const payload: LandingPageJSON = {
        version: '2.0',
        tenantId,
        tenantSlug: getTenantSlug(tenantId),
        status: 'draft',
        updatedAt: new Date().toISOString(),
        seo: getCurrentSEO(),
        theme: getCurrentTheme(),
        craftState: JSON.parse(craftState),
        blocks,
      };

      return fetch(`/api/landing/${tenantId}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },
  });

  // Cargar borrador
  const loadDraft = async (jsonString: string) => {
    const json: LandingPageJSON = JSON.parse(jsonString);
    actions.deserialize(JSON.stringify(json.craftState)); // ← restaura el estado
  };

  // Publicar
  const publish = useMutation({
    mutationFn: async () => {
      await saveDraft.mutateAsync();
      return fetch(`/api/landing/${tenantId}/publish`, { method: 'POST' });
    },
  });

  return { saveDraft, loadDraft, publish };
}
```

---

## 7. API Endpoints Necesarios

### En el Dashboard (app.emprendy.ai)

```
GET    /api/landing/[tenantId]              ← Cargar JSON actual
PUT    /api/landing/[tenantId]/draft        ← Guardar borrador
POST   /api/landing/[tenantId]/publish      ← Publicar
DELETE /api/landing/[tenantId]/draft        ← Descartar borrador
GET    /api/landing/[tenantId]/history      ← Historial de versiones

POST   /api/ai/generate-landing            ← Generar JSON completo con IA
POST   /api/ai/improve-copy                ← Mejorar texto seleccionado
POST   /api/ai/suggest-palette             ← Sugerir paleta desde logo/industria
POST   /api/ai/generate-block              ← Generar un bloque individual
```

### En el Renderer ({tenant}.emprendyup.com)

```
GET    /api/landing/[tenantSlug]           ← Obtiene JSON publicado (cache 60s ISR)
```

---

## 8. LandingRenderer (Repositorio Público)

**Archivo:** `packages/landing-renderer/src/LandingRenderer.tsx`

```typescript
import dynamic from "next/dynamic";
import { ThemeProvider } from "./theme/ThemeProvider";
import type { LandingPageJSON, LandingBlock } from "./types/landing-json.schema";

// Lazy load de cada bloque para code splitting
const BLOCK_MAP = {
  HeroBanner:          dynamic(() => import("./blocks/HeroBanner")),
  ProductGrid:         dynamic(() => import("./blocks/ProductGrid")),
  AboutSection:        dynamic(() => import("./blocks/AboutSection")),
  TestimonialsSection: dynamic(() => import("./blocks/TestimonialsSection")),
  ContactSection:      dynamic(() => import("./blocks/ContactSection")),
  GallerySection:      dynamic(() => import("./blocks/GallerySection")),
  NavigationBar:       dynamic(() => import("./blocks/NavigationBar")),
  FooterSection:       dynamic(() => import("./blocks/FooterSection")),
  CTABanner:           dynamic(() => import("./blocks/CTABanner")),
  BookingForm:         dynamic(() => import("./blocks/BookingForm")),
  BrandSection:        dynamic(() => import("./blocks/BrandSection")),
} as const;

interface LandingRendererProps {
  json: LandingPageJSON;
}

export function LandingRenderer({ json }: LandingRendererProps) {
  const visibleBlocks = json.blocks
    .filter((b) => b.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <ThemeProvider theme={json.theme}>
      <main>
        {visibleBlocks.map((block) => {
          const Component = BLOCK_MAP[block.type as keyof typeof BLOCK_MAP];
          if (!Component) return null;

          return (
            <Component
              key={block.id}
              {...(block.props as any)}
              variant={block.variant}
            />
          );
        })}
      </main>
    </ThemeProvider>
  );
}

// Uso en la página pública del tenant:
// export default async function TenantPage({ params }) {
//   const json = await fetch(`/api/landing/${params.slug}`).then(r => r.json());
//   return <LandingRenderer json={json} />;
// }
```

---

## 9. Sistema de Temas Multitenant

**Archivo:** `features/landing-editor/theme/presets/elegant-dark.ts`

```typescript
import type { LandingTheme } from '../../types/landing-json.schema';

export const elegantDark: LandingTheme = {
  preset: 'elegant-dark',
  colors: {
    primary: '#BFA26A',
    secondary: '#1A1512',
    accent: '#D4AF6A',
    background: '#FAF9F6',
    surface: '#F0EBE3',
    text: '#1A1512',
    textMuted: '#6B5E4E',
  },
  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    scale: 'lg',
  },
  spacing: 'relaxed',
  borderRadius: 'sm',
  shadows: 'subtle',
};
```

**ThemeProvider aplica CSS custom properties:**

```typescript
// Transforma el tema en CSS variables globales
// --color-primary: #BFA26A
// --color-secondary: #1A1512
// --font-heading: 'Playfair Display', serif
// --font-body: 'Inter', sans-serif
// etc.
// Los componentes usan: className="text-[var(--color-primary)]"
// O con Tailwind plugin personalizado: className="text-primary"
```

**Presets disponibles:**

| ID              | Nombre                | Industrias ideales                  |
| --------------- | --------------------- | ----------------------------------- |
| `elegant-dark`  | Elegante Oscuro       | Joyería, moda premium, bodas        |
| `modern-light`  | Moderno Claro         | Tech, SaaS, servicios profesionales |
| `natural-earth` | Natural & Tierra      | Orgánicos, bienestar, artesanías    |
| `bold-vibrant`  | Audaz & Vibrante      | Deportes, música, juventud          |
| `minimal-mono`  | Minimal Monocromático | Diseño, fotografía, portafolios     |

---

## 10. Integración de IA

**Archivo:** `features/landing-editor/ai/prompts/generateLanding.ts`

```typescript
export function buildGenerateLandingPrompt(context: {
  businessName: string;
  businessDescription: string;
  industry: string;
  products: string[];
  tone: 'formal' | 'casual' | 'inspirational';
  targetAudience: string;
  preferredTheme?: string;
}): string {
  return `
Eres un experto en diseño de landing pages para e-commerce.
Genera un JSON completo para una landing page con esta información:

Negocio: ${context.businessName}
Descripción: ${context.businessDescription}
Industria: ${context.industry}
Productos: ${context.products.join(', ')}
Tono: ${context.tone}
Audiencia objetivo: ${context.targetAudience}

El JSON debe seguir exactamente este schema:
{
  "blocks": [
    {
      "id": "string único",
      "type": "HeroBanner|ProductGrid|AboutSection|TestimonialsSection|ContactSection|GallerySection|CTABanner",
      "variant": "string (variante del bloque)",
      "visible": true,
      "order": number,
      "props": { ...props específicas del bloque }
    }
  ],
  "theme": {
    "preset": "elegant-dark|modern-light|natural-earth|bold-vibrant|minimal-mono",
    "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "surface": "#hex", "text": "#hex", "textMuted": "#hex" },
    "typography": { "headingFont": "Google Font", "bodyFont": "Google Font", "scale": "sm|md|lg|xl" },
    "spacing": "compact|normal|relaxed",
    "borderRadius": "none|sm|md|lg|full",
    "shadows": "none|subtle|medium|strong"
  },
  "seo": { "title": "string", "description": "string", "keywords": ["string"] }
}

Responde SOLO con el JSON válido, sin markdown, sin explicaciones.
  `.trim();
}
```

**Hook de generación:**

```typescript
// features/landing-editor/ai/useAIGeneration.ts
export function useAIGeneration() {
  const { actions } = useEditor();

  const generateFullLanding = async (prompt: AIPromptContext) => {
    const response = await fetch('/api/ai/generate-landing', {
      method: 'POST',
      body: JSON.stringify(prompt),
    });
    const { craftJSON, theme, seo } = await response.json();

    // Cargar el JSON generado directamente en el canvas de Craft.js
    actions.deserialize(craftJSON);
    // Actualizar tema y SEO en el estado global
    updateTheme(theme);
    updateSEO(seo);
  };

  const improveCopy = async (selectedText: string, context: string) => {
    const response = await fetch('/api/ai/improve-copy', {
      method: 'POST',
      body: JSON.stringify({ text: selectedText, context }),
    });
    return response.json(); // devuelve texto mejorado
  };

  return { generateFullLanding, improveCopy };
}
```

---

## 11. Fases de Implementación

### FASE 1 — Base Craft.js (Semana 1–2)

**Objetivo:** Editor funcional con los bloques actuales migrados

- [ ] Instalar dependencias: `@craftjs/core`, `@tanstack/react-query`
- [ ] Crear `EditorRoot.tsx` con `<Editor resolver={...}>`
- [ ] Migrar los 11 bloques actuales a Craft.js nodes con sus props exactas
- [ ] Implementar `EditorCanvas.tsx` con `<Frame>` de Craft.js
- [ ] Implementar `ToolboxPanel.tsx` (lista de bloques arrastrables)
- [ ] Implementar `PropertiesPanel.tsx` (renderiza el `settings` del nodo seleccionado)
- [ ] Implementar `EditorToolbar.tsx` con Desktop/Mobile preview toggle
- [ ] Conectar `useLandingDraft` con el endpoint `PUT /api/landing/[id]/draft`
- [ ] Migrar deserialización del JSON actual al nuevo schema v2.0

**Criterio de aceptación:** Los 11 bloques se pueden arrastrar, soltar y editar sus props. Guardar/publicar funciona.

---

### FASE 2 — Variantes de Bloques y Temas (Semana 3)

**Objetivo:** Múltiples variantes visuales por bloque + sistema de temas

- [ ] Crear 2–3 variantes por cada bloque principal (HeroBanner, ProductGrid, AboutSection)
- [ ] Implementar `ThemeProvider.tsx` con CSS custom properties
- [ ] Crear los 5 presets de tema (archivos `.ts`)
- [ ] Implementar `ThemeSelector.tsx` con preview visual en tiempo real
- [ ] Agregar prop `variant` al schema JSON y al selector en PropertiesPanel
- [ ] Adaptar todos los componentes del renderer para usar las CSS variables

**Criterio de aceptación:** Cambiar un preset de tema actualiza instantáneamente todos los bloques del canvas.

---

### FASE 3 — IA Integration (Semana 4)

**Objetivo:** Generación automática y mejora de contenido con IA

- [ ] Crear endpoint `POST /api/ai/generate-landing` (GPT-4o / Claude API)
- [ ] Crear endpoint `POST /api/ai/improve-copy`
- [ ] Crear endpoint `POST /api/ai/suggest-palette`
- [ ] Implementar `AIAssistantPanel.tsx` con formulario de descripción del negocio
- [ ] Conectar `useAIGeneration` hook con los endpoints
- [ ] Implementar prompt engineering con contexto del tenant (nombre, industria, productos)
- [ ] Agregar botón "✨ Mejorar con IA" en el PropertiesPanel para textos

**Criterio de aceptación:** Un usuario nuevo puede describir su negocio en 2 frases y obtener una landing completa lista para editar en < 10 segundos.

---

### FASE 4 — Renderer Compartido y Monorepo (Semana 5)

**Objetivo:** Sincronizar editor y sitio público del tenant

- [ ] Crear paquete `packages/landing-renderer` con los bloques en modo read-only
- [ ] Implementar `LandingRenderer.tsx` principal
- [ ] Configurar Turborepo para compartir el paquete entre dashboard y renderer
- [ ] Implementar ISR en el renderer: `revalidate: 60` o `on-demand revalidation` al publicar
- [ ] Agregar `POST /api/landing/[id]/publish` que dispara revalidación en el renderer
- [ ] Smoke tests: publicar desde el editor y verificar render en el tenant público

**Criterio de aceptación:** Publicar una landing en el editor refleja cambios en `{tenant}.emprendyup.com` en menos de 5 segundos.

---

### FASE 5 — UX Polish y Funcionalidades Avanzadas (Semana 6)

**Objetivo:** Experiencia de usuario de nivel profesional

- [ ] Implementar Undo/Redo nativo de Craft.js (`actions.history.undo/redo`)
- [ ] Agregar `LayersPanel.tsx` con visualización del árbol de bloques
- [ ] Indicadores de drag & drop (highlight de zonas válidas)
- [ ] Animaciones de transición entre estados del editor (Framer Motion)
- [ ] Onboarding modal para usuarios nuevos: "¿Quieres que la IA genere tu primera landing?"
- [ ] Historial de versiones (`GET /api/landing/[id]/history`)
- [ ] Modo preview fullscreen sin UI del editor
- [ ] Shortcut keys: `Cmd+S` guardar, `Cmd+Z` undo, `Cmd+Shift+Z` redo, `Del` eliminar bloque

**Criterio de aceptación:** Un usuario sin conocimientos técnicos puede crear y publicar su landing en menos de 5 minutos.

---

## 12. Dependencias a Instalar

```bash
# En el dashboard (apps/dashboard)
npm install @craftjs/core
npm install @tanstack/react-query
npm install @tanstack/react-query-devtools --save-dev

# Para IA
npm install openai  # o @anthropic-ai/sdk

# Para drag & drop UI mejorado (opcional, Craft.js ya incluye D&D)
npm install @dnd-kit/core @dnd-kit/sortable

# Para el renderer (packages/landing-renderer)
# No requiere dependencias adicionales — usa React + Tailwind que ya tiene el proyecto
```

---

## 13. Variables de Entorno Necesarias

```env
# IA
OPENAI_API_KEY=sk-...
# o
ANTHROPIC_API_KEY=sk-ant-...

# Para revalidación ISR del renderer
RENDERER_REVALIDATE_SECRET=...
RENDERER_BASE_URL=https://emprendyup.com

# Supabase (si se usa para persistir el JSON)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 14. Criterios de Aceptación Globales

- [ ] El editor carga en < 2 segundos para cualquier tenant
- [ ] Drag & drop es fluido a 60fps en Chrome, Firefox y Safari
- [ ] El JSON generado es idéntico al renderizado en el sitio público
- [ ] Cambiar el tema preview se refleja en < 100ms (solo CSS variables)
- [ ] La generación IA produce un landing válido y usable en > 90% de los casos
- [ ] El editor es mobile-usable (al menos para preview, edición en desktop)
- [ ] Publicar una landing demora < 5 segundos end-to-end
- [ ] No hay breaking changes en el API de renderizado para tenants existentes

---

## 15. Notas para los Agentes

1. **No romper compatibilidad:** Los tenants con JSON v1.0 en producción deben seguir funcionando. Crear un migrador `migrateV1toV2(oldJSON) → LandingPageJSON`.

2. **Craft.js es client-only:** Todo componente que use `useNode()` o `useEditor()` debe tener `"use client"` y estar dentro del `<Editor>` provider.

3. **El renderer NO usa Craft.js:** Los bloques del renderer son componentes React puros, sin ninguna dependencia de Craft.js. La separación es clave para mantener el bundle del sitio público pequeño.

4. **CSS Variables para temas:** No usar `style={{ color: theme.primary }}` inline. Usar `--color-primary` como CSS custom property en `:root` del ThemeProvider y referenciarla con Tailwind arbitrary values o un plugin.

5. **ISR vs SSG:** El renderer debe usar ISR (Incremental Static Regeneration) con revalidación on-demand al publicar, no SSG puro, para que los cambios sean reflejados rápidamente.

6. **Prueba de humo obligatoria por fase:** Antes de mergear cada fase, crear un tenant de prueba, generar una landing con IA, publicar y verificar el render en el dominio público.
