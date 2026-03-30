# Landing Renderer — FASE 4: Renderer Público Compartido

> **Repositorio destino:** `emprendyup-renderer` (o el repo del sitio público del tenant)
> **Objetivo:** Renderizar las landing pages generadas por el editor en `emprendyup-fe-app` como sitios públicos con ISR.
> **Criterio de aceptación:** Publicar desde el editor refleja cambios en `{tenant}.emprendyup.com` en < 5 segundos.

---

## 1. Contexto del sistema

El editor (en `emprendyup-fe-app`) guarda el contenido como un `LandingPageJSON` en el backend GraphQL. Este renderer lo consume y lo convierte en una página pública estática con ISR.

```
Editor (emprendyup-fe-app)
  └─ Publica → GraphQL backend → guarda LandingPageJSON
                                        │
Renderer (este repo)                    │
  └─ GET /api/landing/[tenantSlug]  ────┘
  └─ Renderiza con ISR (revalidate: 60)
  └─ Revalidación on-demand al publicar
```

**El renderer NO usa Craft.js.** Lee únicamente el array `blocks` del JSON — componentes React puros, cero dependencias del editor.

---

## 2. Schema de datos compartido (copiar exacto)

Crea `src/types/landing-json.schema.ts` con este contenido exacto. Este schema es el contrato entre editor y renderer — no lo modifiques.

```typescript
// ─── Landing Page JSON Schema v2.0 ────────────────────────────────────────────

export interface LandingPageJSON {
  version: '2.0';
  tenantId: string;
  tenantSlug: string;
  status: 'draft' | 'published';
  updatedAt: string;
  publishedAt?: string;
  seo: LandingSEO;
  theme: LandingTheme;
  craftState: CraftSerializedNodes; // opaco — no usar en el renderer
  blocks: LandingBlock[]; // usar SOLO este array para renderizar
}

export interface LandingSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
}

export interface LandingTheme {
  preset: ThemePreset;
  colors: LandingThemeColors;
  typography: LandingTypography;
  spacing: 'compact' | 'normal' | 'relaxed';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadows: 'none' | 'subtle' | 'medium' | 'strong';
}

export interface LandingThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export interface LandingTypography {
  headingFont: string; // Google Font name, ej: "Playfair Display"
  bodyFont: string;
  scale: 'sm' | 'md' | 'lg' | 'xl';
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
  | 'CustomHTML';

// Opaco — no usar en el renderer
export type CraftSerializedNodes = Record<string, unknown>;
```

---

## 3. CSS Custom Properties (sistema de temas)

El renderer aplica los mismos CSS custom properties que el editor. Crea `src/components/renderer/RendererThemeProvider.tsx`:

```tsx
import type { LandingTheme } from '@/types/landing-json.schema';

const RADIUS_MAP = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '16px',
  full: '9999px',
} as const;

interface Props {
  theme: LandingTheme;
  children: React.ReactNode;
}

export function RendererThemeProvider({ theme, children }: Props) {
  const cssVars: React.CSSProperties = {
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--color-accent': theme.colors.accent,
    '--color-bg': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-text': theme.colors.text,
    '--color-text-muted': theme.colors.textMuted,
    '--font-heading': theme.typography.headingFont,
    '--font-body': theme.typography.bodyFont,
    '--radius': RADIUS_MAP[theme.borderRadius],
  } as React.CSSProperties;

  const fonts = [...new Set([theme.typography.headingFont, theme.typography.bodyFont])];

  return (
    <div style={cssVars}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?${fonts
          .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`)
          .join('&')}&display=swap');
      `}</style>
      {children}
    </div>
  );
}
```

---

## 4. Bloques del renderer (componentes puros — sin Craft.js)

Crea `src/components/renderer/blocks/` con un archivo por bloque. Cada bloque recibe `props: Record<string, unknown>` y `variant: string`. **Sin `useNode()`, sin `useEditor()`, sin `"use client"` salvo si tiene interactividad propia.**

### Estructura de archivos

```
src/components/renderer/
├── RendererThemeProvider.tsx
├── LandingRenderer.tsx          ← componente principal
└── blocks/
    ├── HeroBannerRenderer.tsx
    ├── ProductGridRenderer.tsx
    ├── AboutSectionRenderer.tsx
    ├── TestimonialsSectionRenderer.tsx
    ├── ContactSectionRenderer.tsx
    ├── GallerySectionRenderer.tsx
    ├── NavigationBarRenderer.tsx
    ├── FooterSectionRenderer.tsx
    ├── CTABannerRenderer.tsx
    ├── BookingFormRenderer.tsx
    ├── BrandSectionRenderer.tsx
    └── CustomHTMLRenderer.tsx
```

### Props que usa cada bloque (extraídas del editor)

| Bloque                | Props principales                                                           |
| --------------------- | --------------------------------------------------------------------------- |
| `HeroBanner`          | `title`, `subtitle`, `ctaLabel`, `ctaHref`, `imageUrl`, `variant`           |
| `ProductGrid`         | `title`, `subtitle`, `variant` (`grid`/`list`/`featured`)                   |
| `AboutSection`        | `title`, `description`, `imageUrl`, `variant` (`default`/`timeline`/`team`) |
| `TestimonialsSection` | `title`, `testimonials: [{name, text, role}]`, `variant`                    |
| `ContactSection`      | `title`, `subtitle`, `showForm`, `showMap`, `variant`                       |
| `GallerySection`      | `title`, `subtitle`, `images: string[]`, `variant`                          |
| `NavigationBar`       | `logoText`, `links: [{label, href}]`, `ctaLabel`, `variant`                 |
| `FooterSection`       | `logoText`, `tagline`, `copyrightText`, `links`, `variant`                  |
| `CTABanner`           | `title`, `subtitle`, `ctaLabel`, `ctaHref`, `variant`                       |
| `BookingForm`         | `title`, `subtitle`, `fields`, `variant`                                    |
| `BrandSection`        | `tagline`, `description`, `logoUrl`, `variant`                              |
| `CustomHTML`          | `html: string`                                                              |

### Template de bloque renderer

```tsx
// HeroBannerRenderer.tsx — ejemplo de implementación
import type { LandingBlock } from '@/types/landing-json.schema';

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
  variant?: 'gradient-overlay' | 'split-image' | 'minimal';
}

export function HeroBannerRenderer({
  props,
  variant,
}: {
  props: Record<string, unknown>;
  variant: string;
}) {
  const p = props as HeroBannerProps;
  const v = (variant || p.variant || 'gradient-overlay') as HeroBannerProps['variant'];

  if (v === 'split-image') {
    return (
      <section className="flex min-h-[500px]" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="flex-1 flex flex-col justify-center px-12 py-16">
          <h1
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
            className="text-5xl font-bold mb-4"
          >
            {p.title}
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }} className="text-xl mb-8">
            {p.subtitle}
          </p>
          {p.ctaLabel && (
            <a
              href={p.ctaHref || '#'}
              style={{
                backgroundColor: 'var(--color-primary)',
                borderRadius: 'var(--radius)',
                color: '#fff',
              }}
              className="inline-block px-8 py-3 font-semibold"
            >
              {p.ctaLabel}
            </a>
          )}
        </div>
        {p.imageUrl && (
          <div className="flex-1 relative">
            <img src={p.imageUrl} alt={p.title || ''} className="w-full h-full object-cover" />
          </div>
        )}
      </section>
    );
  }

  // gradient-overlay (default) y minimal: implementar similares
  return (
    <section
      className="relative min-h-[500px] flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {p.imageUrl && (
        <img
          src={p.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      )}
      <div className="relative z-10 text-center px-6">
        <h1
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          className="text-5xl font-bold mb-4"
        >
          {p.title}
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }} className="text-xl mb-8">
          {p.subtitle}
        </p>
        {p.ctaLabel && (
          <a
            href={p.ctaHref || '#'}
            style={{
              backgroundColor: 'var(--color-primary)',
              borderRadius: 'var(--radius)',
              color: '#fff',
            }}
            className="inline-block px-8 py-3 font-semibold"
          >
            {p.ctaLabel}
          </a>
        )}
      </div>
    </section>
  );
}
```

---

## 5. LandingRenderer — componente principal

```tsx
// src/components/renderer/LandingRenderer.tsx
import type { LandingPageJSON, LandingBlock } from '@/types/landing-json.schema';
import { RendererThemeProvider } from './RendererThemeProvider';
import { HeroBannerRenderer } from './blocks/HeroBannerRenderer';
import { ProductGridRenderer } from './blocks/ProductGridRenderer';
import { AboutSectionRenderer } from './blocks/AboutSectionRenderer';
import { TestimonialsSectionRenderer } from './blocks/TestimonialsSectionRenderer';
import { ContactSectionRenderer } from './blocks/ContactSectionRenderer';
import { GallerySectionRenderer } from './blocks/GallerySectionRenderer';
import { NavigationBarRenderer } from './blocks/NavigationBarRenderer';
import { FooterSectionRenderer } from './blocks/FooterSectionRenderer';
import { CTABannerRenderer } from './blocks/CTABannerRenderer';
import { BookingFormRenderer } from './blocks/BookingFormRenderer';
import { BrandSectionRenderer } from './blocks/BrandSectionRenderer';
import { CustomHTMLRenderer } from './blocks/CustomHTMLRenderer';

type BlockRendererProps = { props: Record<string, unknown>; variant: string };
type BlockRendererComponent = React.ComponentType<BlockRendererProps>;

const BLOCK_RENDERERS: Partial<Record<string, BlockRendererComponent>> = {
  HeroBanner: HeroBannerRenderer,
  ProductGrid: ProductGridRenderer,
  AboutSection: AboutSectionRenderer,
  TestimonialsSection: TestimonialsSectionRenderer,
  ContactSection: ContactSectionRenderer,
  GallerySection: GallerySectionRenderer,
  NavigationBar: NavigationBarRenderer,
  FooterSection: FooterSectionRenderer,
  CTABanner: CTABannerRenderer,
  BookingForm: BookingFormRenderer,
  BrandSection: BrandSectionRenderer,
  CustomHTML: CustomHTMLRenderer,
};

function renderBlock(block: LandingBlock): React.ReactNode {
  if (!block.visible) return null;
  const Renderer = BLOCK_RENDERERS[block.type];
  if (!Renderer) return null;
  return <Renderer key={block.id} props={block.props} variant={block.variant} />;
}

interface LandingRendererProps {
  landing: LandingPageJSON;
}

export function LandingRenderer({ landing }: LandingRendererProps) {
  const sorted = [...landing.blocks].sort((a, b) => a.order - b.order);

  return (
    <RendererThemeProvider theme={landing.theme}>
      <main style={{ backgroundColor: 'var(--color-bg)' }}>{sorted.map(renderBlock)}</main>
    </RendererThemeProvider>
  );
}
```

---

## 6. Página pública con ISR — Next.js App Router

### `src/app/[tenantSlug]/page.tsx`

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LandingRenderer } from '@/components/renderer/LandingRenderer';
import type { LandingPageJSON } from '@/types/landing-json.schema';

const GQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT!;

async function fetchLandingPage(tenantSlug: string): Promise<LandingPageJSON | null> {
  try {
    const res = await fetch(GQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetPublishedLanding($tenantSlug: String!) {
            getPublishedLanding(tenantSlug: $tenantSlug) {
              contentJson
            }
          }
        `,
        variables: { tenantSlug },
      }),
      next: { revalidate: 60, tags: [`landing-${tenantSlug}`] },
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { getPublishedLanding?: { contentJson: string } } };
    const raw = json.data?.getPublishedLanding?.contentJson;
    if (!raw) return null;

    return JSON.parse(raw) as LandingPageJSON;
  } catch {
    return null;
  }
}

interface Props {
  params: { tenantSlug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const landing = await fetchLandingPage(params.tenantSlug);
  if (!landing) return { title: 'Página no encontrada' };

  return {
    title: landing.seo.title,
    description: landing.seo.description,
    keywords: landing.seo.keywords,
    openGraph: {
      title: landing.seo.title,
      description: landing.seo.description,
      images: landing.seo.ogImage ? [landing.seo.ogImage] : [],
    },
  };
}

export default async function TenantLandingPage({ params }: Props) {
  const landing = await fetchLandingPage(params.tenantSlug);
  if (!landing) notFound();

  return <LandingRenderer landing={landing} />;
}
```

---

## 7. Revalidación on-demand al publicar

### `src/app/api/revalidate/route.ts`

```typescript
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const secret = req.headers.get('x-revalidate-secret');
  if (secret !== process.env.RENDERER_REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { tenantSlug?: string };
  if (!body.tenantSlug) {
    return NextResponse.json({ error: 'tenantSlug required' }, { status: 400 });
  }

  revalidateTag(`landing-${body.tenantSlug}`);

  return NextResponse.json({
    revalidated: true,
    tenantSlug: body.tenantSlug,
    timestamp: new Date().toISOString(),
  });
}
```

**En el editor** (`emprendyup-fe-app`), al publicar, llamar este endpoint:

```typescript
// En useLandingPersistence.ts → después de publishLanding exitoso:
await fetch(`${process.env.NEXT_PUBLIC_RENDERER_BASE_URL}/api/revalidate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-revalidate-secret': process.env.NEXT_PUBLIC_RENDERER_REVALIDATE_SECRET!,
  },
  body: JSON.stringify({ tenantSlug: tenant.slug }),
});
```

---

## 8. Variables de entorno

### En este repo (renderer):

```env
GRAPHQL_ENDPOINT=https://api.emprendy.ai/graphql
RENDERER_REVALIDATE_SECRET=<string-secreto-compartido-con-el-editor>
```

### En el editor (`emprendyup-fe-app`):

```env
NEXT_PUBLIC_RENDERER_BASE_URL=https://renderer.emprendyup.com
NEXT_PUBLIC_RENDERER_REVALIDATE_SECRET=<mismo-string-secreto>
```

---

## 9. Dependencias a instalar

```bash
# El renderer NO necesita @craftjs/core
# Solo React + Next.js + Tailwind (lo que ya tiene el proyecto)
npm install  # nada nuevo si Next.js + Tailwind ya están instalados
```

---

## 10. Checklist de implementación

- [ ] Copiar `src/types/landing-json.schema.ts` (sección 2)
- [ ] Crear `RendererThemeProvider.tsx` (sección 3)
- [ ] Implementar los 12 bloques renderer en `src/components/renderer/blocks/` (sección 4)
- [ ] Crear `LandingRenderer.tsx` (sección 5)
- [ ] Crear `src/app/[tenantSlug]/page.tsx` con ISR (sección 6)
- [ ] Crear `src/app/api/revalidate/route.ts` (sección 7)
- [ ] Configurar variables de entorno (sección 8)
- [ ] En `emprendyup-fe-app`: disparar revalidación después de `publishLanding`
- [ ] Smoke test: publicar desde el editor → verificar en `{slug}.emprendyup.com` en < 5s

---

## 11. Notas importantes

1. **Sin Craft.js:** El renderer lee únicamente `landing.blocks` — nunca toques `landing.craftState`.

2. **CSS vars idénticas al editor:** Usa exactamente los mismos nombres de variable (`--color-primary`, `--font-heading`, etc.) para garantizar que el render público sea visual mente idéntico al preview del editor.

3. **Tema custom:** Si `landing.theme.preset === 'custom'`, los colores están en `landing.theme.colors` — el `RendererThemeProvider` los aplica igual.

4. **ISR + on-demand:** `revalidate: 60` como fallback, más `revalidateTag` on-demand al publicar. Así el sitio nunca queda más de 60s desactualizado incluso si el webhook falla.

5. **`visible: false`:** Respetar el campo `block.visible` — si es `false`, no renderizar el bloque (el editor permite ocultar bloques sin eliminarlos).

6. **`order`:** Siempre ordenar `blocks.sort((a, b) => a.order - b.order)` antes de renderizar.

7. **Bloques faltantes:** Si `BLOCK_RENDERERS[block.type]` es `undefined` (bloque futuro no implementado), simplemente retornar `null` — nunca crashear.
