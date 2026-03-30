'use client';

import { useRef, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { useNode, type UserComponent } from '@craftjs/core';
import { useSessionStore } from '@/lib/store/dashboard';
import { ProductGridSettings } from './ProductGrid.settings';
import { PRODUCT_GRID_DEFAULTS, type ProductGridProps } from './ProductGrid.props';

// ── GQL ───────────────────────────────────────────────────────────────────────

const GET_PRODUCTS_BY_STORE = gql`
  query ProductGridGetByStore(
    $storeId: String!
    $internal: String!
    $available: String!
    $page: Int
    $pageSize: Int
  ) {
    productsByStore(
      storeId: $storeId
      internal: $internal
      available: $available
      page: $page
      pageSize: $pageSize
    ) {
      items {
        id
        name
        title
        price
        currency
        images {
          id
          url
          order
        }
      }
    }
  }
`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface SliderProduct {
  id: string;
  name: string;
  title: string;
  price: number;
  currency: string;
  images: { id: string; url: string; order: number }[];
}

interface ProductsByStoreData {
  productsByStore: { items: SliderProduct[] };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency || 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  } catch {
    return `$${price.toLocaleString('es-CL')}`;
  }
}

function firstImage(product: SliderProduct): string | null {
  if (!product.images || product.images.length === 0) return null;
  return [...product.images].sort((a, b) => a.order - b.order)[0]?.url ?? null;
}

// ── ProductCard ───────────────────────────────────────────────────────────────
// Renders consistently: fixed aspect-ratio image area + details below.

interface ProductCardProps {
  product: SliderProduct;
  showPrices: boolean;
  showAddToCart: boolean;
  /** "slider" keeps 208 px fixed width; "grid" fills the column */
  layout: 'slider' | 'grid';
}

function ProductCard({ product, showPrices, showAddToCart, layout }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const img = firstImage(product);
  const label = product.title || product.name;

  return (
    <div
      className={[
        'rounded-xl border border-gray-100 overflow-hidden flex flex-col shadow-sm',
        layout === 'slider' ? 'w-52 shrink-0 snap-start' : 'w-full',
      ].join(' ')}
      style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}
    >
      {/* ── Image area — fixed aspect ratio so every card is identical ── */}
      <div className="relative w-full" style={{ paddingBottom: '100%' /* 1:1 */ }}>
        {img && !imgError ? (
          <img
            src={img}
            alt={label}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          /* Placeholder shown when no image or image fails to load */
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100">
            <svg
              className="w-10 h-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4-4 4 4 4-6 4 6M4 8h.01"
              />
            </svg>
          </div>
        )}
      </div>

      {/* ── Details ── */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p
          className="text-sm font-medium line-clamp-2 leading-snug"
          style={{ color: 'var(--color-text, #111827)' }}
        >
          {label}
        </p>
        {showPrices && (
          <p
            className="text-sm font-bold mt-auto pt-1"
            style={{ color: 'var(--color-primary, #6366f1)' }}
          >
            {formatPrice(product.price, product.currency)}
          </p>
        )}
        {showAddToCart && (
          <button
            data-testid="product-add-to-cart"
            className="mt-2 text-xs rounded-lg px-3 py-1.5 w-full font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary, #6366f1)' }}
          >
            Agregar al carrito
          </button>
        )}
      </div>
    </div>
  );
}

// ── Slider arrows ─────────────────────────────────────────────────────────────

function ArrowButton({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      data-testid={`slider-arrow-${dir}`}
      onClick={onClick}
      className="absolute top-[calc(50%-2rem)] -translate-y-1/2 z-10 flex items-center justify-center
                 w-9 h-9 rounded-full shadow-md bg-white border border-gray-200
                 text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors"
      style={{ [dir === 'prev' ? 'left' : 'right']: '-1rem' }}
      aria-label={dir === 'prev' ? 'Anterior' : 'Siguiente'}
    >
      {dir === 'prev' ? '‹' : '›'}
    </button>
  );
}

// ── VARIANT: Slider ───────────────────────────────────────────────────────────

const SCROLL_STEP = 224;

function VariantSlider({
  products,
  showPrices,
  showAddToCart,
}: {
  products: SliderProduct[];
  showPrices: boolean;
  showAddToCart: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'prev' | 'next') =>
    trackRef.current?.scrollBy({
      left: dir === 'next' ? SCROLL_STEP * 3 : -SCROLL_STEP * 3,
      behavior: 'smooth',
    });

  return (
    <div className="relative px-4">
      <ArrowButton dir="prev" onClick={() => scroll('prev')} />
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            showPrices={showPrices}
            showAddToCart={showAddToCart}
            layout="slider"
          />
        ))}
      </div>
      <ArrowButton dir="next" onClick={() => scroll('next')} />
    </div>
  );
}

// ── VARIANT: Grid ─────────────────────────────────────────────────────────────
// All cards in a responsive grid — uniform image size via padding-bottom trick.

function VariantGrid({
  products,
  showPrices,
  showAddToCart,
  cols,
}: {
  products: SliderProduct[];
  showPrices: boolean;
  showAddToCart: boolean;
  cols: 3 | 4;
}) {
  const gridClass =
    cols === 4
      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5'
      : 'grid grid-cols-2 sm:grid-cols-3 gap-5';

  return (
    <div className={gridClass}>
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          showPrices={showPrices}
          showAddToCart={showAddToCart}
          layout="grid"
        />
      ))}
    </div>
  );
}

// ── VARIANT: Featured ─────────────────────────────────────────────────────────

function VariantFeatured({
  products,
  showPrices,
  showAddToCart,
}: {
  products: SliderProduct[];
  showPrices: boolean;
  showAddToCart: boolean;
}) {
  const [featured, ...rest] = products;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {featured && (
        <div className="lg:col-span-2">
          <ProductCard
            product={featured}
            showPrices={showPrices}
            showAddToCart={showAddToCart}
            layout="grid"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {rest.slice(0, 4).map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            showPrices={showPrices}
            showAddToCart={showAddToCart}
            layout="grid"
          />
        ))}
      </div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonCard({ layout }: { layout: 'slider' | 'grid' }) {
  return (
    <div
      className={[
        'rounded-xl border border-gray-100 overflow-hidden animate-pulse',
        layout === 'slider' ? 'w-52 shrink-0' : 'w-full',
      ].join(' ')}
      style={{ backgroundColor: 'var(--color-surface, #fff)' }}
    >
      <div className="w-full" style={{ paddingBottom: '100%', background: '#e5e7eb' }} />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export const ProductGrid: UserComponent<ProductGridProps> = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const storeId = useSessionStore((s) => s.user?.storeId ?? '');

  const { data, loading } = useQuery<ProductsByStoreData>(GET_PRODUCTS_BY_STORE, {
    variables: {
      storeId,
      internal: 'true',
      available: 'true',
      page: 1,
      pageSize: Math.min(props.maxItems, 12),
    },
    skip: !storeId,
  });

  const products = data?.productsByStore.items ?? [];

  // Determine layout from variant
  const isGrid3 = props.variant === 'grid-3' || props.variant === 'grid';
  const isGrid4 = props.variant === 'grid-4';
  const isFeatured = props.variant === 'featured';
  const isList = props.variant === 'list';
  const isSlider = !isGrid3 && !isGrid4 && !isFeatured && !isList;

  return (
    <section
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-block-type="ProductGrid"
      className="w-full cursor-move py-16 px-6"
      style={{ backgroundColor: 'var(--color-bg, #f9fafb)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2
            className="text-3xl font-bold"
            style={{ color: 'var(--color-text, #111827)', fontFamily: 'var(--font-heading)' }}
          >
            {props.title}
          </h2>
          {props.subtitle && (
            <p
              className="mt-2 text-base"
              style={{ color: 'var(--color-text-muted, #6b7280)', fontFamily: 'var(--font-body)' }}
            >
              {props.subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          /* Skeletons mirror the active layout */
          isSlider ? (
            <div className="flex gap-4 overflow-hidden px-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} layout="slider" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} layout="grid" />
              ))}
            </div>
          )
        ) : products.length === 0 ? (
          <div
            className="text-center py-16 rounded-xl border border-dashed border-gray-300"
            style={{ color: 'var(--color-text-muted, #9ca3af)' }}
          >
            <p className="text-sm font-medium">No hay productos disponibles aún.</p>
            <p className="text-xs mt-1 opacity-60">Agrega productos desde el panel de gestión.</p>
          </div>
        ) : isGrid4 ? (
          <VariantGrid
            products={products}
            showPrices={props.showPrices}
            showAddToCart={props.showAddToCart}
            cols={4}
          />
        ) : isGrid3 ? (
          <VariantGrid
            products={products}
            showPrices={props.showPrices}
            showAddToCart={props.showAddToCart}
            cols={3}
          />
        ) : isFeatured ? (
          <VariantFeatured
            products={products}
            showPrices={props.showPrices}
            showAddToCart={props.showAddToCart}
          />
        ) : (
          /* list + default slider */
          <VariantSlider
            products={products}
            showPrices={props.showPrices}
            showAddToCart={props.showAddToCart}
          />
        )}
      </div>
    </section>
  );
};

ProductGrid.craft = {
  displayName: 'Grilla de Productos',
  props: { ...PRODUCT_GRID_DEFAULTS, variant: 'grid', maxItems: 12 },
  related: { settings: ProductGridSettings },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
