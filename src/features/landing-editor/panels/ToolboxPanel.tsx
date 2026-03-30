'use client';

// ─── ToolboxPanel ──────────────────────────────────────────────────────────────
// Panel izquierdo del editor. Muestra todos los bloques disponibles como
// elementos arrastrables hacia el canvas de Craft.js.
//
// Cada ítem usa connectors.create(domRef, <Component />) para que Craft.js
// sepa qué nodo instanciar al soltar el bloque sobre el canvas.
// Los props iniciales se enriquecen con los datos reales de la tienda.

import React from 'react';
import { useEditor } from '@craftjs/core';
import {
  BLOCK_META,
  BLOCK_REGISTRY,
  HERO_BANNER_DEFAULTS,
  PRODUCT_GRID_DEFAULTS,
  ABOUT_SECTION_DEFAULTS,
  CONTACT_SECTION_DEFAULTS,
  TESTIMONIALS_DEFAULTS,
  GALLERY_DEFAULTS,
  NAVIGATION_BAR_DEFAULTS,
  FOOTER_SECTION_DEFAULTS,
  CTA_BANNER_DEFAULTS,
  BOOKING_FORM_DEFAULTS,
  BRAND_SECTION_DEFAULTS,
} from '../blocks';
import {
  isBlockAllowedForTenant,
  getStoreAwareDefaults,
  type TenantContext,
  type TenantType,
} from '../context/TenantContext';
import { useLandingEditor } from '../context/LandingEditorContext';

interface ToolboxPanelProps {
  tenantType?: TenantType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

const BLOCK_DEFAULT_PROPS: Record<keyof typeof BLOCK_REGISTRY, AnyRecord> = {
  HeroBanner: HERO_BANNER_DEFAULTS,
  ProductGrid: PRODUCT_GRID_DEFAULTS,
  AboutSection: ABOUT_SECTION_DEFAULTS,
  TestimonialsSection: TESTIMONIALS_DEFAULTS,
  ContactSection: CONTACT_SECTION_DEFAULTS,
  GallerySection: GALLERY_DEFAULTS,
  NavigationBar: NAVIGATION_BAR_DEFAULTS,
  FooterSection: FOOTER_SECTION_DEFAULTS,
  CTABanner: CTA_BANNER_DEFAULTS,
  BookingForm: BOOKING_FORM_DEFAULTS,
  BrandSection: BRAND_SECTION_DEFAULTS,
};

// Grupos visuales en el toolbox
const GROUPS: Array<{ label: string; blocks: Array<keyof typeof BLOCK_REGISTRY> }> = [
  {
    label: 'Estructura',
    blocks: ['NavigationBar', 'FooterSection'],
  },
  {
    label: 'Contenido',
    blocks: ['HeroBanner', 'AboutSection', 'CTABanner', 'BrandSection'],
  },
  {
    label: 'Productos',
    blocks: ['ProductGrid'],
  },
  {
    label: 'Social',
    blocks: ['TestimonialsSection', 'GallerySection'],
  },
  {
    label: 'Contacto',
    blocks: ['ContactSection', 'BookingForm'],
  },
];

// ─── DraggableBlock ────────────────────────────────────────────────────────────

interface DraggableBlockProps {
  blockKey: keyof typeof BLOCK_REGISTRY;
  tenant: TenantContext;
}

function DraggableBlock({ blockKey, tenant }: DraggableBlockProps) {
  const { connectors, actions, query } = useEditor();
  const meta = BLOCK_META[blockKey];
  const Component = BLOCK_REGISTRY[blockKey] as React.ComponentType<AnyRecord>;

  // Merge static defaults with real store data for live-feeling previews
  const defaultProps = {
    ...BLOCK_DEFAULT_PROPS[blockKey],
    ...getStoreAwareDefaults(blockKey, tenant),
  };

  // Blocks that must live at specific positions in ROOT
  const PREPEND_BLOCKS = new Set(['NavigationBar']);
  const APPEND_BLOCKS = new Set(['FooterSection']);

  // Click → add block at the correct position in ROOT canvas
  const handleClick = () => {
    const nodeTree = query
      .parseReactElement(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        React.createElement(Component as React.ComponentType<AnyRecord>, defaultProps)
      )
      .toNodeTree();

    if (PREPEND_BLOCKS.has(blockKey)) {
      // Insert as first child (index 0) — so header sits above all content
      actions.addNodeTree(nodeTree, 'ROOT', 0);
    } else if (APPEND_BLOCKS.has(blockKey)) {
      // Append after all existing nodes — footer always at the bottom
      const rootNode = query.node('ROOT').get();
      actions.addNodeTree(nodeTree, 'ROOT', rootNode.data.nodes.length);
    } else {
      // Content blocks: insert before FooterSection if it exists, else append
      const rootNode = query.node('ROOT').get();
      const children = rootNode.data.nodes;
      const footerIdx = children.findIndex((id) => {
        const n = query.node(id).get();
        return n?.data?.displayName === 'FooterSection' || n?.data?.name === 'FooterSection';
      });
      const insertAt = footerIdx >= 0 ? footerIdx : children.length;
      actions.addNodeTree(nodeTree, 'ROOT', insertAt);
    }
  };

  return (
    <div
      ref={(el) => {
        if (!el) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connectors.create(el, React.createElement(Component as any, defaultProps));
      }}
      onClick={handleClick}
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm
                 text-gray-300 hover:bg-gray-700 hover:text-white active:scale-95
                 transition-all select-none"
      title={`Clic para agregar · Arrastra para posicionar`}
    >
      <span className="text-base leading-none w-5 shrink-0">{meta.icon}</span>
      <div className="flex flex-col min-w-0">
        <span className="leading-tight truncate">{meta.displayName}</span>
        <span className="text-[10px] text-gray-500 leading-none mt-0.5">clic o arrastra</span>
      </div>
    </div>
  );
}

// ─── ToolboxPanel ──────────────────────────────────────────────────────────────

export function ToolboxPanel({ tenantType = 'store' }: ToolboxPanelProps) {
  const { tenant } = useLandingEditor();
  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-700">
        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest">Bloques</p>
        <p className="text-gray-600 text-[10px] mt-0.5">Arrastra al canvas</p>
      </div>

      {/* Block groups */}
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4">
        {GROUPS.map((group) => {
          const visibleBlocks = group.blocks.filter((key) =>
            isBlockAllowedForTenant(key, tenantType)
          );
          if (visibleBlocks.length === 0) return null;

          return (
            <div key={group.label}>
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleBlocks.map((blockKey) => (
                  <DraggableBlock key={blockKey} blockKey={blockKey} tenant={tenant} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
