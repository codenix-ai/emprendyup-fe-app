'use client';

import { useNode } from '@craftjs/core';
import type { ProductGridProps, ProductGridVariant } from './ProductGrid.props';
import { PRODUCT_GRID_VARIANTS } from './ProductGrid.props';

export function ProductGridSettings() {
  const {
    props,
    actions: { setProp },
  } = useNode<{ props: ProductGridProps }>((node) => ({
    props: node.data.props as ProductGridProps,
  }));

  return (
    <div className="flex flex-col gap-4 p-3 text-sm text-white">
      <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-400">
        Grilla de Productos
      </h3>

      {/* Variant */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Estilo de grilla</span>
        <select
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.variant}
          onChange={(e) =>
            setProp((p: ProductGridProps) => {
              p.variant = e.target.value as ProductGridVariant;
            })
          }
        >
          {(Object.entries(PRODUCT_GRID_VARIANTS) as Array<[ProductGridVariant, string]>).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </label>

      {/* Title */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Título</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.title}
          onChange={(e) =>
            setProp((p: ProductGridProps) => {
              p.title = e.target.value;
            })
          }
        />
      </label>

      {/* Subtitle */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Subtítulo</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.subtitle}
          onChange={(e) =>
            setProp((p: ProductGridProps) => {
              p.subtitle = e.target.value;
            })
          }
        />
      </label>

      {/* Max items */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Máximo de productos</span>
        <input
          type="number"
          min={1}
          max={24}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.maxItems}
          onChange={(e) =>
            setProp((p: ProductGridProps) => {
              p.maxItems = parseInt(e.target.value) || 6;
            })
          }
        />
      </label>

      {/* Toggles */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={props.showPrices}
          onChange={(e) =>
            setProp((p: ProductGridProps) => {
              p.showPrices = e.target.checked;
            })
          }
        />
        <span className="text-gray-300">Mostrar precios</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={props.showAddToCart}
          onChange={(e) =>
            setProp((p: ProductGridProps) => {
              p.showAddToCart = e.target.checked;
            })
          }
        />
        <span className="text-gray-300">Botón &quot;Agregar al carrito&quot;</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={props.visible}
          onChange={(e) =>
            setProp((p: ProductGridProps) => {
              p.visible = e.target.checked;
            })
          }
        />
        <span className="text-gray-300">Visible</span>
      </label>
    </div>
  );
}
