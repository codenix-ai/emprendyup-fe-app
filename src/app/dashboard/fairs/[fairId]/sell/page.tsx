'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  User,
  X,
} from 'lucide-react';

import { fairsApi, Fair } from '@/lib/api/fairs';
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
  const [showCustomerForm, setShowCustomerForm] = useState(false);
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

  const products = useMemo(
    () =>
      (data?.productsByStore?.items || []) as Array<{
        id: string;
        name?: string;
        title?: string;
        price?: number;
        currency?: string;
        stock?: number;
      }>,
    [data?.productsByStore?.items]
  );

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
  const quantities = useMemo(() => per?.quantities || {}, [per?.quantities]);
  const customItems = useMemo(() => per?.customItems ?? [], [per?.customItems]);

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

  const totalItems =
    selectedCatalogItems.reduce((a, it) => a + it.quantity, 0) +
    customItems.reduce((a, it) => a + it.quantity, 0);

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
    <div className="flex flex-col bg-gray-50 dark:bg-gray-950" style={{ minHeight: '100dvh' }}>
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 py-2 flex items-center gap-2 shadow-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white flex-none"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate text-gray-900 dark:text-white leading-tight">
            {fair?.name || 'Feria'}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
            {active ? (
              <span className="text-emerald-600 dark:text-emerald-400">Activa</span>
            ) : (
              <span className="text-red-500">No activa</span>
            )}
            {' · '}
            {!effectiveStoreId || loadingProducts
              ? 'Cargando…'
              : `${products.length} producto${products.length === 1 ? '' : 's'}`}
          </p>
        </div>
        {/* Cart badge */}
        <div className="flex-none relative">
          <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </div>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-fourth-base text-black text-[10px] font-bold flex items-center justify-center leading-none">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </div>
        <Link
          href={`/dashboard/fairs/${fairId}`}
          className="flex-none text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
        >
          Detalle
        </Link>
      </div>

      {/* ── Success banner ── */}
      {lastSuccess && (
        <div className="mx-3 mt-3 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-900/20 p-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-none mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Venta registrada —{' '}
                <span className="font-bold">{formatMoney(lastSuccess.total, currency)}</span>
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                {lastSuccess.itemCount} item{lastSuccess.itemCount !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLastSuccess(null)}
              className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex-none"
            >
              Ok
            </button>
          </div>
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="flex-none bg-white dark:bg-gray-900 px-3 pt-2 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-3 py-2">
          <Search className="h-4 w-4 text-gray-400 flex-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en catálogo…"
            className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 flex-none">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto pb-2">
        {/* Catalog products */}
        {!effectiveStoreId || loadingProducts ? (
          <div className="m-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm text-gray-500 dark:text-gray-400">
            Cargando productos…
          </div>
        ) : productsError ? (
          <div className="m-3 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="font-semibold text-red-900 dark:text-red-200 text-sm">
              No se pudieron cargar los productos
            </p>
            <p className="mt-1 text-xs text-red-700 dark:text-red-300">{productsError.message}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="m-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm text-gray-500 dark:text-gray-400">
            No hay productos.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 mt-2 mx-3 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {filtered.map((p) => {
              const qty = quantities[p.id] || 0;
              return (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                  {/* Name + price */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug truncate">
                      {p.name || p.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatMoney(toNumber(p.price), p.currency || currency)}
                      {qty > 0 && (
                        <span className="ml-1.5 font-semibold text-gray-700 dark:text-gray-200">
                          = {formatMoney(toNumber(p.price) * qty, p.currency || currency)}
                        </span>
                      )}
                    </p>
                  </div>
                  {/* Stepper */}
                  <div className="flex items-center gap-1 flex-none">
                    {qty > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => decrement(fairId, p.id)}
                          className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-bold text-base flex items-center justify-center"
                          aria-label="Disminuir"
                        >
                          −
                        </button>
                        <input
                          inputMode="numeric"
                          value={qty}
                          onChange={(e) => setQuantity(fairId, p.id, Number(e.target.value || 0))}
                          className="w-9 h-8 text-center text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => increment(fairId, p.id)}
                          className="h-8 w-8 rounded-lg bg-fourth-base text-black font-bold text-base flex items-center justify-center"
                          aria-label="Aumentar"
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => increment(fairId, p.id)}
                        className="h-8 w-8 rounded-xl bg-fourth-base text-black font-bold text-xl flex items-center justify-center"
                        aria-label="Agregar"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isFetchingMore && <p className="text-center text-xs text-gray-400 py-2">Cargando más…</p>}

        {/* ── Custom items ── */}
        <div className="mt-3 mx-3">
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-900/10 overflow-hidden">
            {/* Toggle header */}
            <button
              type="button"
              onClick={() => setShowCustomForm((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                  Producto personalizado
                </span>
                {customItems.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 font-medium">
                    {customItems.length}
                  </span>
                )}
              </div>
              {showCustomForm ? (
                <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
            </button>

            {/* Add form */}
            {showCustomForm && (
              <div className="px-4 pb-4 space-y-3 border-t border-amber-200 dark:border-amber-900/50 pt-3">
                <input
                  ref={customNameRef}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
                  placeholder="Nombre del producto *"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
                      placeholder="Precio *"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-6 pr-3 py-2.5 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
                    placeholder="Cantidad"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold bg-fourth-base text-black flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Agregar
                </button>
              </div>
            )}

            {/* Custom items list */}
            {customItems.length > 0 && (
              <div className="divide-y divide-amber-100 dark:divide-amber-900/30 border-t border-amber-200 dark:border-amber-900/50">
                {customItems.map((it) => (
                  <div key={it.id} className="px-3 py-2.5 flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {it.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMoney(it.unitPrice, currency)}
                        {it.quantity > 1 && (
                          <span className="ml-1 font-semibold text-gray-700 dark:text-gray-200">
                            = {formatMoney(it.unitPrice * it.quantity, currency)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-none">
                      <button
                        type="button"
                        onClick={() => updateCustomItemQty(fairId, it.id, it.quantity - 1)}
                        className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 font-bold flex items-center justify-center"
                      >
                        −
                      </button>
                      <input
                        inputMode="numeric"
                        value={it.quantity}
                        onChange={(e) =>
                          updateCustomItemQty(fairId, it.id, Number(e.target.value || 1))
                        }
                        className="w-9 h-8 text-center text-sm font-semibold rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => updateCustomItemQty(fairId, it.id, it.quantity + 1)}
                        className="h-8 w-8 rounded-lg bg-fourth-base text-black font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCustomItem(fairId, it.id)}
                        className="h-8 w-8 rounded-lg text-red-500 flex items-center justify-center"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>

      {/* ── Sticky bottom bar ── */}
      <div className="flex-none sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        {/* Payment method pills */}
        <div className="px-3 pt-3">
          <div
            className="flex gap-1.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {PAYMENT_METHODS.map((m) => {
              const selected = (per?.paymentMethod || 'CASH') === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(fairId, m.value)}
                  className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selected
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer info toggle */}
        <div className="px-3 pt-2">
          <button
            type="button"
            onClick={() => setShowCustomerForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium"
          >
            <User className="h-3.5 w-3.5" />
            {showCustomerForm ? 'Ocultar datos de cliente' : 'Agregar datos de cliente'}
            {showCustomerForm ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          {showCustomerForm && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                value={per?.customerName || ''}
                onChange={(e) => setCustomerName(fairId, e.target.value)}
                placeholder="Nombre"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
              <input
                value={per?.customerContact || ''}
                onChange={(e) => setCustomerContact(fairId, e.target.value)}
                placeholder="Tel / email"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {!active && (
            <p className="text-xs text-red-500 text-center mb-1">
              Feria no activa · no se puede registrar venta
            </p>
          )}
          <button
            type="button"
            disabled={submitting || totalItems === 0 || !active}
            onClick={submitSale}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-semibold bg-fourth-base text-black disabled:opacity-50 transition-opacity"
          >
            <ShoppingCart className="h-5 w-5" />
            {submitting
              ? 'Registrando…'
              : total > 0
                ? `Registrar · ${formatMoney(total, currency)}`
                : 'Selecciona productos'}
          </button>
        </div>
      </div>
    </div>
  );
}
