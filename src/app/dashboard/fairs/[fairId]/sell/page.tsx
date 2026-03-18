'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Plus, Search, ShoppingCart, Trash2, X } from 'lucide-react';

import { fairsApi, Fair, FairsApiError } from '@/lib/api/fairs';
import { useFairCartStore } from '@/lib/store/fairCart';
import { formatMoney, toNumber } from '@/lib/utils/money';

const GET_PRODUCTS_BY_STORE_FOR_FAIR = gql`
  query ProductsByStore($storeId: String!, $page: Int!, $pageSize: Int!) {
    productsByStore(
      storeId: $storeId
      page: $page
      pageSize: $pageSize
      available: "true"
      internal: "false"
    ) {
      items {
        id
        name
        price
        currency
        stock
        inStock
        available
        images {
          url
        }
      }
      total
      page
      pageSize
    }
  }
`;

const PAYMENT_METHODS: Array<{ value: string; label: string }> = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'NEQUI', label: 'Nequi' },
  { value: 'DAVIPLATA', label: 'Daviplata' },
  { value: 'PSE', label: 'PSE' },
  { value: 'CREDIT_CARD', label: 'Tarjeta crédito' },
  { value: 'DEBIT_CARD', label: 'Tarjeta débito' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'OTHER', label: 'Otro' },
];

function isFairActive(fair?: Fair | null): boolean {
  if (!fair) return false;
  const raw = (fair.status || '').toUpperCase();
  if (fair.isActive === true) return true;
  if (raw.includes('ACTIVE') || raw.includes('RUNNING')) return true;
  if (raw.includes('CLOSED')) return false;
  if (fair.closedAt) return false;
  const now = Date.now();
  const start = fair.startsAt ? new Date(fair.startsAt).getTime() : 0;
  const end = fair.endsAt ? new Date(fair.endsAt).getTime() : 0;
  return start <= now && now <= end;
}

function friendlySaleError(err: unknown): string {
  const msg = (err as Error)?.message || '';
  const lower = String(msg).toLowerCase();
  if (lower.includes('insufficient stock')) return 'Stock insuficiente para uno o más productos.';
  if (
    lower.includes('fair is not active') ||
    lower.includes('not active') ||
    lower.includes('not running')
  )
    return 'La feria no está activa. No se puede registrar la venta.';
  return msg || 'No se pudo registrar la venta.';
}

export default function FairSellPage() {
  const router = useRouter();
  const params = useParams<{ fairId: string }>();
  const fairId = params.fairId;

  const {
    byFairId,
    ensureFair,
    increment,
    decrement,
    setQuantity,
    clearFair,
    setPaymentMethod,
    setCustomerName,
    setCustomerContact,
    addCustomItem,
    removeCustomItem,
    updateCustomItemQty,
  } = useFairCartStore();

  const per = byFairId[fairId];

  const [fair, setFair] = useState<Fair | null>(null);
  const [loadingFair, setLoadingFair] = useState(true);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<{ total: number; itemCount: number } | null>(null);

  // Custom item form state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const customNameRef = useRef<HTMLInputElement>(null);

  const userStoreId = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const resolved = parsed?.storeId ?? parsed?.store?.id ?? parsed?.store?.storeId;
      if (!resolved) return null;
      return String(resolved);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    ensureFair(fairId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fairId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingFair(true);
      try {
        const f = await fairsApi.getFairById(fairId);
        if (mounted) setFair(f);
      } catch (e: unknown) {
        toast.error((e as Error)?.message || 'No se pudo cargar la feria');
      } finally {
        if (mounted) setLoadingFair(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fairId]);

  useEffect(() => {
    if (showCustomForm) setTimeout(() => customNameRef.current?.focus(), 50);
  }, [showCustomForm]);

  const storeId = fair?.storeId;
  const effectiveStoreId = storeId || userStoreId || '';
  const active = useMemo(() => isFairActive(fair), [fair]);

  const pageSize = 200;
  const autoPagingRef = useRef<{ storeId: string; calls: number }>({ storeId: '', calls: 0 });
  const {
    data,
    loading: loadingProducts,
    error: productsError,
    fetchMore,
    networkStatus,
  } = useQuery(GET_PRODUCTS_BY_STORE_FOR_FAIR, {
    variables: { storeId: effectiveStoreId, page: 1, pageSize },
    skip: !effectiveStoreId,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
  });

  const isFetchingMore = networkStatus === 3;

  useEffect(() => {
    if (!productsError) return;
    toast.error(productsError.message || 'No se pudieron cargar los productos');
  }, [productsError]);

  useEffect(() => {
    if (autoPagingRef.current.storeId !== effectiveStoreId)
      autoPagingRef.current = { storeId: effectiveStoreId, calls: 0 };
    if (!effectiveStoreId || loadingProducts || isFetchingMore) return;

    const total = toNumber(data?.productsByStore?.total);
    const currentItems = (data?.productsByStore?.items || []) as unknown[];
    const currentPage = toNumber(data?.productsByStore?.page) || 1;
    const currentPageSize = toNumber(data?.productsByStore?.pageSize) || pageSize;

    if (!total || !Array.isArray(currentItems) || currentItems.length >= total) return;

    const maxCalls = Math.min(Math.ceil(total / Math.max(1, currentPageSize)) + 5, 300);
    if (autoPagingRef.current.calls >= maxCalls) return;
    autoPagingRef.current.calls += 1;

    void fetchMore({
      variables: { storeId: effectiveStoreId, page: currentPage + 1, pageSize: currentPageSize },
      updateQuery: (prev, { fetchMoreResult }) => {
        const prevItems =
          (prev as Record<string, { items: unknown[] }>)?.productsByStore?.items || [];
        const moreItems =
          (fetchMoreResult as Record<string, { items: unknown[] }>)?.productsByStore?.items || [];
        if (!Array.isArray(moreItems) || moreItems.length === 0) return prev;
        const byId = new Map<string, unknown>();
        [...prevItems, ...moreItems].forEach((p) => {
          if ((p as { id?: string })?.id) byId.set(String((p as { id: string }).id), p);
        });
        return {
          ...(prev as Record<string, unknown>),
          productsByStore: {
            ...((fetchMoreResult as Record<string, Record<string, unknown>>).productsByStore ?? {}),
            items: Array.from(byId.values()),
            total:
              (fetchMoreResult as Record<string, { total?: unknown }>)?.productsByStore?.total ??
              (prev as Record<string, { total?: unknown }>)?.productsByStore?.total,
          },
        };
      },
    });
  }, [data, effectiveStoreId, fetchMore, isFetchingMore, loadingProducts]);

  const products = (data?.productsByStore?.items || []) as Array<{
    id: string;
    name?: string;
    title?: string;
    price?: number;
    currency?: string;
    stock?: number;
  }>;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      String(p?.name || p?.title || '')
        .toLowerCase()
        .includes(q)
    );
  }, [products, search]);

  const currency = (products[0]?.currency as string) || 'COP';
  const quantities = per?.quantities || {};
  const customItems = per?.customItems ?? [];

  const catalogTotal = useMemo(() => {
    let sum = 0;
    for (const p of products) {
      const qty = quantities[p.id] || 0;
      if (qty) sum += toNumber(p.price) * qty;
    }
    return sum;
  }, [products, quantities]);

  const customTotal = useMemo(() => {
    return customItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  }, [customItems]);

  const total = catalogTotal + customTotal;

  const selectedCatalogItems = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([productId, quantity]) => ({ productId, quantity })),
    [quantities]
  );

  function handleAddCustomItem() {
    const name = customName.trim();
    const price = parseFloat(customPrice);
    const qty = Math.max(1, parseInt(customQty, 10) || 1);
    if (!name) {
      toast.error('Ingresa el nombre del producto');
      return;
    }
    if (!price || price <= 0) {
      toast.error('Ingresa un precio válido');
      return;
    }
    addCustomItem(fairId, { name, unitPrice: price, quantity: qty });
    setCustomName('');
    setCustomPrice('');
    setCustomQty('1');
    setShowCustomForm(false);
    toast.success(`"${name}" agregado`);
  }

  async function submitSale() {
    if (!active) {
      toast.error('La feria no está activa.');
      return;
    }
    if (selectedCatalogItems.length === 0 && customItems.length === 0) {
      toast.error('Agrega al menos un producto.');
      return;
    }
    setSubmitting(true);
    try {
      const customItemsPayload = customItems.map((it) => ({
        productName: it.name,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
      }));

      const res = await fairsApi.createSale(fairId, {
        paymentMethod: per?.paymentMethod || 'CASH',
        items: [...selectedCatalogItems, ...customItemsPayload],
        customerName: per?.customerName || undefined,
        customerContact: per?.customerContact || undefined,
      });

      const itemCount =
        selectedCatalogItems.reduce((a, it) => a + it.quantity, 0) +
        customItems.reduce((a, it) => a + it.quantity, 0);

      setLastSuccess({ sale: res, total, itemCount } as unknown as {
        total: number;
        itemCount: number;
      });
      toast.success('Venta registrada');

      clearFair(fairId);
      setPaymentMethod(fairId, per?.paymentMethod || 'CASH');
      setCustomerName(fairId, per?.customerName || '');
      setCustomerContact(fairId, per?.customerContact || '');
    } catch (e: unknown) {
      toast.error(friendlySaleError(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingFair) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          Cargando feria...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-lg p-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white truncate">
              Vender en: {fair?.name || 'Feria'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {active ? 'Activa' : 'No activa'} •
              {!effectiveStoreId
                ? ' Cargando tienda…'
                : loadingProducts
                  ? ' Cargando productos…'
                  : ` ${products.length} producto${products.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/fairs/${fairId}`}
          className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          Detalle
        </Link>
      </div>

      {/* Success banner */}
      {lastSuccess && (
        <div className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-900/20 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Venta registrada
              </p>
              <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80">
                Total:{' '}
                <span className="font-semibold">{formatMoney(lastSuccess.total, currency)}</span>
              </p>
              <p className="text-xs text-emerald-900/70 dark:text-emerald-200/70">
                Items: {lastSuccess.itemCount}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLastSuccess(null)}
              className="ml-auto text-sm font-semibold text-emerald-800 dark:text-emerald-200"
            >
              Ok
            </button>
          </div>
        </div>
      )}

      {/* Payment + customer */}
      <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
            Método de pago
          </label>
          <select
            value={per?.paymentMethod || 'CASH'}
            onChange={(e) => setPaymentMethod(fairId, e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-base text-gray-900 dark:text-white"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              Nombre cliente
            </label>
            <input
              value={per?.customerName || ''}
              onChange={(e) => setCustomerName(fairId, e.target.value)}
              placeholder="Opcional"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-base text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              Contacto
            </label>
            <input
              value={per?.customerContact || ''}
              onChange={(e) => setCustomerContact(fairId, e.target.value)}
              placeholder="Tel / email"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-base text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* ── Custom items section ── */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Productos personalizados
          </h2>
          <button
            type="button"
            onClick={() => setShowCustomForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold bg-fourth-base text-black"
          >
            {showCustomForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCustomForm ? 'Cancelar' : 'Agregar'}
          </button>
        </div>

        {/* Inline add form */}
        {showCustomForm && (
          <div className="rounded-2xl border border-fourth-base/40 bg-amber-50/50 dark:bg-amber-900/10 p-4 mb-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Nuevo producto personalizado
            </p>
            <input
              ref={customNameRef}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
              placeholder="Nombre del producto *"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-base text-gray-900 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Precio *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-7 pr-3 py-2.5 text-base text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-base text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddCustomItem}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold bg-fourth-base text-black"
            >
              <Plus className="h-4 w-4" />
              Agregar producto
            </button>
          </div>
        )}

        {/* Custom items list */}
        {customItems.length > 0 && (
          <div className="space-y-2">
            {customItems.map((it) => (
              <div
                key={it.id}
                className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-900/10 p-3 sm:p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate leading-tight">
                      {it.name}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      {formatMoney(it.unitPrice, currency)} · subtotal{' '}
                      <span className="font-medium">
                        {formatMoney(it.unitPrice * it.quantity, currency)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCustomItemQty(fairId, it.id, it.quantity - 1)}
                      className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold flex items-center justify-center"
                    >
                      −
                    </button>
                    <input
                      inputMode="numeric"
                      value={it.quantity}
                      onChange={(e) =>
                        updateCustomItemQty(fairId, it.id, Number(e.target.value || 1))
                      }
                      className="w-12 sm:w-14 h-10 text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-base text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => updateCustomItemQty(fairId, it.id, it.quantity + 1)}
                      className="h-10 w-10 rounded-xl bg-fourth-base text-black text-lg font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCustomItem(fairId, it.id)}
                      className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {customItems.length === 0 && !showCustomForm && (
          <p className="text-sm text-gray-400 dark:text-gray-600 italic">
            Sin productos personalizados.
          </p>
        )}
      </div>

      {/* Catalog search */}
      <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en catálogo..."
            className="w-full bg-transparent outline-none text-base text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Catalog products */}
      <div className="mt-3 space-y-3">
        {!effectiveStoreId || loadingProducts ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            Cargando productos...
          </div>
        ) : productsError ? (
          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-900/20 p-4">
            <p className="font-semibold text-red-900 dark:text-red-200">
              No se pudieron cargar los productos
            </p>
            <p className="mt-1 text-sm text-red-900/80 dark:text-red-200/80">
              {productsError.message}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            No hay productos para mostrar.
          </div>
        ) : (
          filtered.map((p) => {
            const qty = quantities[p.id] || 0;
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate leading-tight">
                      {p.name || p.title}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      {formatMoney(toNumber(p.price), p.currency || currency)}
                      {typeof p.stock === 'number' ? ` · ${p.stock} disp.` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => decrement(fairId, p.id)}
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold flex items-center justify-center"
                      aria-label="Disminuir"
                    >
                      −
                    </button>
                    <input
                      inputMode="numeric"
                      value={qty}
                      onChange={(e) => setQuantity(fairId, p.id, Number(e.target.value || 0))}
                      className="w-12 sm:w-16 h-10 sm:h-11 text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-base text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => increment(fairId, p.id)}
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-fourth-base text-black text-lg font-bold flex items-center justify-center"
                      aria-label="Aumentar"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isFetchingMore && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm text-gray-600 dark:text-gray-300">
            Cargando más productos...
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 mt-6 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-white dark:from-gray-900 via-white/90 dark:via-gray-900/90 to-transparent">
        {(customItems.length > 0 || selectedCatalogItems.length > 0) && (
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
            {selectedCatalogItems.length > 0 && (
              <span>
                Catálogo: {selectedCatalogItems.reduce((a, it) => a + it.quantity, 0)} item(s)
              </span>
            )}
            {customItems.length > 0 && (
              <span>
                Personalizados: {customItems.reduce((a, it) => a + it.quantity, 0)} item(s)
              </span>
            )}
          </div>
        )}
        <button
          type="button"
          disabled={submitting}
          onClick={submitSale}
          className="w-full inline-flex items-center justify-center gap-3 rounded-2xl px-4 py-4 text-base font-semibold bg-fourth-base text-black disabled:opacity-60"
        >
          <ShoppingCart className="h-5 w-5" />
          {submitting ? 'Registrando…' : `Registrar venta · ${formatMoney(total, currency)}`}
        </button>
        {!active && (
          <p className="mt-2 text-xs text-red-600 text-center">
            Feria no activa: no se puede registrar venta.
          </p>
        )}
      </div>
    </div>
  );
}
