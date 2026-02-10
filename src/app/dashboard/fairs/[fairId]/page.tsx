'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock, RefreshCcw, ShoppingCart, X } from 'lucide-react';
import { Fair, FairSale, FairSummary, FairsApiError, fairsApi } from '@/lib/api/fairs';
import { GET_PRODUCTS_BY_STORE } from '@/lib/graphql/queries';
import { formatMoney, toNumber } from '@/lib/utils/money';

function formatDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

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

function normalizeSummary(raw: any): FairSummary {
  return {
    totalSold: toNumber(raw?.totalSold ?? raw?.total ?? raw?.totalAmount),
    numberOfSales: toNumber(raw?.numberOfSales ?? raw?.salesCount ?? raw?.count),
    currency: raw?.currency,
  };
}

function getProductImageUrl(product: any): string | null {
  const url = product?.images?.[0]?.url;
  return typeof url === 'string' && url.length ? url : null;
}

function getSaleItems(items: any): any[] {
  return Array.isArray(items) ? items : [];
}

function getSaleItemLines(items: any[]): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => {
      const name = String(it?.productName || it?.product?.name || it?.product?.title || 'Producto');
      const qty = toNumber(it?.quantity);
      return qty ? `${name} x${qty}` : name;
    })
    .filter(Boolean);
}

function calcLineTotal(item: any): number {
  const explicit = toNumber(item?.lineTotal);
  if (explicit) return explicit;
  const unit = toNumber(item?.unitPrice);
  const qty = toNumber(item?.quantity);
  return unit && qty ? unit * qty : 0;
}

function formatPaymentMethod(method?: string): string {
  const m = String(method || '').toUpperCase();
  const map: Record<string, string> = {
    CASH: 'Efectivo',
    NEQUI: 'Nequi',
    DAVIPLATA: 'Daviplata',
    PSE: 'PSE',
    CREDIT_CARD: 'Tarjeta crédito',
    DEBIT_CARD: 'Tarjeta débito',
    TRANSFER: 'Transferencia',
    OTHER: 'Otro',
  };
  return map[m] || method || '—';
}

export default function FairDetailPage() {
  const router = useRouter();
  const params = useParams<{ fairId: string }>();
  const fairId = params.fairId;

  const [fair, setFair] = useState<Fair | null>(null);
  const [sales, setSales] = useState<FairSale[]>([]);
  const [summary, setSummary] = useState<FairSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  const active = useMemo(() => isFairActive(fair), [fair]);

  async function load() {
    setLoading(true);
    try {
      const [f, s, sum] = await Promise.all([
        fairsApi.getFairById(fairId),
        fairsApi.listSales(fairId),
        fairsApi.getSummary(fairId),
      ]);
      setFair(f);
      setSales(Array.isArray(s) ? s : []);
      setSummary(normalizeSummary(sum));
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo cargar el detalle de la feria');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fairId]);

  async function handleCloseFair() {
    setClosing(true);
    try {
      await fairsApi.closeFair(fairId);
      toast.success('Feria cerrada');
      setConfirmClose(false);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo cerrar la feria');
    } finally {
      setClosing(false);
    }
  }

  const currency = summary?.currency || 'COP';

  const storeId = fair?.storeId;
  const { data: productsData } = useQuery(GET_PRODUCTS_BY_STORE, {
    variables: { storeId: storeId || '', page: 1, pageSize: 200 },
    skip: !storeId,
  });

  const productsById = useMemo(() => {
    const items = productsData?.productsByStore?.items;
    if (!Array.isArray(items)) return {} as Record<string, any>;
    return items.reduce((acc: Record<string, any>, p: any) => {
      if (p?.id) acc[p.id] = p;
      return acc;
    }, {});
  }, [productsData]);

  const selectedSaleItems = useMemo(() => getSaleItems(selectedSale?.items), [selectedSale]);
  const selectedSaleCurrency =
    (selectedSale as any)?.currency || (selectedSale as any)?.saleCurrency || currency;
  const selectedSaleTotal = toNumber(
    (selectedSale as any)?.total ??
      (selectedSale as any)?.amount ??
      (selectedSale as any)?.totalAmount
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-lg p-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white truncate">
              {fair?.name || 'Feria'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {fair?.startsAt ? formatDate(fair.startsAt) : ''}
              {fair?.endsAt ? ` → ${formatDate(fair.endsAt)}` : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <Link
            href={`/dashboard/fairs/${fairId}/sell`}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
              active ? 'bg-fourth-base text-black' : 'bg-gray-200 text-gray-500 pointer-events-none'
            }`}
            aria-disabled={!active}
          >
            <ShoppingCart className="h-4 w-4" />
            Vender
          </Link>

          <button
            type="button"
            disabled={!active}
            onClick={() => setConfirmClose(true)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
              active ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            <Lock className="h-4 w-4" />
            Cerrar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          Cargando...
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total vendido</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {formatMoney(toNumber(summary?.totalSold), currency)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Número de ventas</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {toNumber(summary?.numberOfSales)}
              </p>
            </div>
          </div>

          {/* Sales table */}
          <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Ventas</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Listado de ventas de esta feria
              </p>
            </div>

            {sales.length === 0 ? (
              <div className="p-4 text-sm text-gray-700 dark:text-gray-200">No hay ventas aún.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr className="text-left text-gray-600 dark:text-gray-300">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Método</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => {
                      const total = toNumber(
                        (s as any).total ?? (s as any).amount ?? (s as any).totalAmount
                      );
                      const saleItems = Array.isArray((s as any).items) ? (s as any).items : [];
                      const itemsCount = saleItems.reduce(
                        (acc: number, it: any) => acc + toNumber(it.quantity),
                        0
                      );
                      const itemLines = getSaleItemLines(saleItems);
                      const preview = itemLines.slice(0, 2);
                      const remaining = Math.max(0, itemLines.length - preview.length);

                      return (
                        <tr
                          key={s.id}
                          className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40 cursor-pointer"
                          onClick={() => setSelectedSale(s)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') setSelectedSale(s);
                          }}
                        >
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            {formatDate((s as any).createdAt)}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                            {formatPaymentMethod((s as any).paymentMethod)}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                            {(s as any).customerName || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{itemsCount}</span>
                              {preview.length > 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {preview.join(' • ')}
                                  {remaining ? ` • +${remaining} más` : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            {total ? formatMoney(total, (s as any).currency || currency) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Sale detail modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedSale(null)} />

          <div className="relative w-full sm:max-w-2xl max-h-[85vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Detalle de venta
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  {formatDate((selectedSale as any)?.createdAt)} •{' '}
                  {formatPaymentMethod((selectedSale as any)?.paymentMethod)}
                  {(selectedSale as any)?.customerName
                    ? ` • ${(selectedSale as any).customerName}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="rounded-xl p-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(85vh-64px)]">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedSaleTotal ? formatMoney(selectedSaleTotal, selectedSaleCurrency) : '—'}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Items</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedSaleItems.reduce(
                      (acc: number, it: any) => acc + toNumber(it?.quantity),
                      0
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Productos</p>
                </div>

                {selectedSaleItems.length === 0 ? (
                  <div className="p-4 text-sm text-gray-700 dark:text-gray-200">Sin items.</div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedSaleItems.map((it: any) => {
                      const productId = it?.productId;
                      const p = productId ? productsById[productId] : null;
                      const imageUrl = getProductImageUrl(p);
                      const name = String(
                        it?.productName || it?.product?.name || p?.name || p?.title || 'Producto'
                      );
                      const qty = toNumber(it?.quantity);
                      const unitPrice = toNumber(it?.unitPrice) || toNumber(p?.price);
                      const lineTotal = calcLineTotal({ ...it, unitPrice });

                      return (
                        <div key={it?.id || `${productId}-${name}`} className="p-4 flex gap-3">
                          <div className="h-14 w-14 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={name}
                                width={56}
                                height={56}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-gray-500">Sin foto</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {name}
                              </p>
                              <span className="px-2 py-1 text-xs rounded-full bg-slate-500/10 text-slate-800 dark:text-slate-200 border border-slate-500/15 flex-shrink-0">
                                x{qty}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                              <p className="text-gray-600 dark:text-gray-300">
                                Unit:{' '}
                                {unitPrice ? formatMoney(unitPrice, selectedSaleCurrency) : '—'}
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {lineTotal ? formatMoney(lineTotal, selectedSaleCurrency) : '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm close modal */}
      {confirmClose && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => (closing ? null : setConfirmClose(false))}
          />
          <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cerrar feria</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Esta acción deshabilita el flujo de venta para esta feria.
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={closing}
                onClick={() => setConfirmClose(false)}
                className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={closing}
                onClick={handleCloseFair}
                className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold bg-red-600 text-white disabled:opacity-60"
              >
                {closing ? 'Cerrando…' : 'Cerrar feria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
