'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, ShoppingCart, CheckCircle2 } from 'lucide-react';

import { fairsApi, Fair, FairsApiError } from '@/lib/api/fairs';
import { useFairCartStore } from '@/lib/store/fairCart';
import { formatMoney, toNumber } from '@/lib/utils/money';

const GET_PRODUCTS_BY_STORE_FOR_FAIR = gql`
  query ProductsByStore($storeId: String!, $page: Int!, $pageSize: Int!) {
    productsByStore(storeId: $storeId, page: $page, pageSize: $pageSize) {
      items {
        id
        name
        price
        currency
        stock
        inStock
        available
        imageUrl
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
  const msg = (err as any)?.message || '';
  const lower = String(msg).toLowerCase();
  if (lower.includes('insufficient stock')) {
    return 'Stock insuficiente para uno o más productos.';
  }
  if (
    lower.includes('fair is not active') ||
    lower.includes('not active') ||
    lower.includes('not running')
  ) {
    return 'La feria no está activa. No se puede registrar la venta.';
  }
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
  } = useFairCartStore();

  const per = byFairId[fairId];

  const [fair, setFair] = useState<Fair | null>(null);
  const [loadingFair, setLoadingFair] = useState(true);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<any>(null);

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
      } catch (e: any) {
        toast.error(e?.message || 'No se pudo cargar la feria');
      } finally {
        if (mounted) setLoadingFair(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fairId]);

  const storeId = fair?.storeId;
  // Prefer the fair's storeId for correctness; fallback to logged-in user's storeId.
  const effectiveStoreId = storeId || userStoreId || '';
  const active = useMemo(() => isFairActive(fair), [fair]);

  // Backend typically enforces a max pageSize; keep it safe and paginate.
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
    // Reset pagination guard when store changes
    if (autoPagingRef.current.storeId !== effectiveStoreId) {
      autoPagingRef.current = { storeId: effectiveStoreId, calls: 0 };
    }

    if (!effectiveStoreId) return;
    if (loadingProducts || isFetchingMore) return;

    const total = toNumber(data?.productsByStore?.total);
    const currentItems = (data?.productsByStore?.items || []) as any[];
    const currentPage = toNumber(data?.productsByStore?.page) || 1;
    const currentPageSize = toNumber(data?.productsByStore?.pageSize) || pageSize;

    if (!total) return;
    if (!Array.isArray(currentItems)) return;
    if (currentItems.length >= total) return;

    // Safety guard to avoid infinite loops if backend behaves unexpectedly.
    const estimatedPages = Math.ceil(total / Math.max(1, currentPageSize));
    const maxCalls = Math.min(estimatedPages + 5, 300);
    if (autoPagingRef.current.calls >= maxCalls) return;
    autoPagingRef.current.calls += 1;

    void fetchMore({
      variables: {
        storeId: effectiveStoreId,
        page: currentPage + 1,
        pageSize: currentPageSize,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        const prevItems = (prev as any)?.productsByStore?.items || [];
        const moreItems = (fetchMoreResult as any)?.productsByStore?.items || [];
        if (!Array.isArray(moreItems) || moreItems.length === 0) return prev;

        const byId = new Map<string, any>();
        [...prevItems, ...moreItems].forEach((p: any) => {
          if (p?.id) byId.set(String(p.id), p);
        });

        return {
          ...(prev as any),
          productsByStore: {
            ...(fetchMoreResult as any).productsByStore,
            items: Array.from(byId.values()),
            total:
              (fetchMoreResult as any)?.productsByStore?.total ??
              (prev as any)?.productsByStore?.total,
          },
        };
      },
    });
  }, [data, effectiveStoreId, fetchMore, isFetchingMore, loadingProducts]);

  const products = (data?.productsByStore?.items || []) as Array<any>;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = String(p?.name || p?.title || '').toLowerCase();
      return name.includes(q);
    });
  }, [products, search]);

  const currency = (products[0]?.currency as string) || 'COP';
  const quantities = per?.quantities || {};

  const total = useMemo(() => {
    let sum = 0;
    for (const p of products) {
      const qty = quantities[p.id] || 0;
      if (!qty) continue;
      sum += toNumber(p.price) * qty;
    }
    return sum;
  }, [products, quantities]);

  const selectedItems = useMemo(() => {
    return Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
  }, [quantities]);

  async function submitSale() {
    if (!active) {
      toast.error('La feria no está activa.');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Agrega al menos un producto.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fairsApi.createSale(fairId, {
        paymentMethod: per?.paymentMethod || 'CASH',
        items: selectedItems,
        customerName: per?.customerName || undefined,
        customerContact: per?.customerContact || undefined,
      });

      setLastSuccess({ sale: res, total, items: selectedItems });
      toast.success('Venta registrada');

      // Clear only quantities; keep payment method + customer fields
      clearFair(fairId);
      setPaymentMethod(fairId, per?.paymentMethod || 'CASH');
      setCustomerName(fairId, per?.customerName || '');
      setCustomerContact(fairId, per?.customerContact || '');
    } catch (e: any) {
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

      {/* Confirmation */}
      {lastSuccess && (
        <div className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-900/20 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div className="min-w-0">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Venta registrada
              </p>
              <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80">
                Total:{' '}
                <span className="font-semibold">{formatMoney(lastSuccess.total, currency)}</span>
              </p>
              <p className="text-xs text-emerald-900/70 dark:text-emerald-200/70">
                Items: {lastSuccess.items.reduce((a: number, it: any) => a + it.quantity, 0)}
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

      {/* Controls */}
      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full bg-transparent outline-none text-base text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Método de pago
            </label>
            <select
              value={per?.paymentMethod || 'CASH'}
              onChange={(e) => setPaymentMethod(fairId, e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-3 text-base text-gray-900 dark:text-white"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Cliente (opcional)
            </label>
            <input
              value={per?.customerName || ''}
              onChange={(e) => setCustomerName(fairId, e.target.value)}
              placeholder="Nombre"
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-3 text-base text-gray-900 dark:text-white"
            />
            <input
              value={per?.customerContact || ''}
              onChange={(e) => setCustomerContact(fairId, e.target.value)}
              placeholder="Contacto (tel/email)"
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-3 text-base text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mt-4 space-y-3">
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
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {p.name || p.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {formatMoney(toNumber(p.price), p.currency || currency)}
                      {typeof p.stock === 'number' ? ` • Stock: ${p.stock}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => decrement(fairId, p.id)}
                      className="h-11 w-11 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold"
                      aria-label="Disminuir"
                    >
                      −
                    </button>
                    <input
                      inputMode="numeric"
                      value={qty}
                      onChange={(e) => setQuantity(fairId, p.id, Number(e.target.value || 0))}
                      className="w-16 h-11 text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-base text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => increment(fairId, p.id)}
                      className="h-11 w-11 rounded-xl bg-fourth-base text-black text-lg font-bold"
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
      <div className="sticky bottom-0 mt-6 pt-3 pb-4 bg-gradient-to-t from-white dark:from-gray-900 via-white/90 dark:via-gray-900/90 to-transparent">
        <button
          type="button"
          disabled={submitting}
          onClick={submitSale}
          className="w-full inline-flex items-center justify-center gap-3 rounded-2xl px-4 py-4 text-base font-semibold bg-fourth-base text-black disabled:opacity-60"
        >
          <ShoppingCart className="h-5 w-5" />
          {submitting ? 'Registrando…' : `Registrar venta • ${formatMoney(total, currency)}`}
        </button>
        {!active && (
          <p className="mt-2 text-xs text-red-600">Feria no activa: no se puede registrar venta.</p>
        )}
      </div>
    </div>
  );
}
