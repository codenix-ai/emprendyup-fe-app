'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit2, Lock, RefreshCcw, Save, ShoppingCart, Trash2, X } from 'lucide-react';
import {
  Fair,
  FairSale,
  FairSummary,
  FairsApiError,
  UpdateFairSaleInput,
  fairsApi,
} from '@/lib/api/fairs';
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

function formatDateShort(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
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

interface EditForm {
  paymentMethod: string;
  customerName: string;
  customerContact: string;
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
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    paymentMethod: 'CASH',
    customerName: '',
    customerContact: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDeleteSale, setConfirmDeleteSale] = useState(false);
  const [deletingSale, setDeletingSale] = useState(false);

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

  function openEditMode() {
    setEditForm({
      paymentMethod: (selectedSale as any)?.paymentMethod || 'CASH',
      customerName: (selectedSale as any)?.customerName || '',
      customerContact: (selectedSale as any)?.customerContact || '',
    });
    setEditMode(true);
  }

  function closeModal() {
    setSelectedSale(null);
    setEditMode(false);
    setConfirmDeleteSale(false);
  }

  async function handleEditSave() {
    if (!selectedSale?.id) return;
    setSavingEdit(true);
    try {
      const input: UpdateFairSaleInput = {
        paymentMethod: editForm.paymentMethod || undefined,
        customerName: editForm.customerName || undefined,
        customerContact: editForm.customerContact || undefined,
      };
      const updated = await fairsApi.updateSale(fairId, selectedSale.id, input);
      toast.success('Venta actualizada');
      setSelectedSale({ ...selectedSale, ...updated });
      setSales((prev) => prev.map((s) => (s.id === selectedSale.id ? { ...s, ...updated } : s)));
      setEditMode(false);
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'No se pudo actualizar la venta');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteSale() {
    if (!selectedSale?.id) return;
    setDeletingSale(true);
    try {
      await fairsApi.deleteSale(fairId, selectedSale.id);
      toast.success('Venta eliminada');
      setSales((prev) => prev.filter((s) => s.id !== selectedSale.id));
      closeModal();
      await load();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'No se pudo eliminar la venta');
    } finally {
      setDeletingSale(false);
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
            <span className="hidden sm:inline">Vender</span>
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
            <span className="hidden sm:inline">Cerrar</span>
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
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total vendido
              </p>
              <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                {formatMoney(toNumber(summary?.totalSold), currency)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Nº de ventas
              </p>
              <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                {toNumber(summary?.numberOfSales)}
              </p>
            </div>
          </div>

          {/* Sales table */}
          <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Ventas</h2>
              {sales.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {sales.length} venta{sales.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {sales.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No hay ventas registradas aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[26%]" />
                    <col className="w-[18%]" />
                    <col className="w-[20%]" />
                    <col className="w-[16%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/60 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Método</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3 text-center">Items</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {sales.map((s) => {
                      const total = toNumber(
                        (s as any).total ?? (s as any).amount ?? (s as any).totalAmount
                      );
                      const saleItems = Array.isArray((s as any).items) ? (s as any).items : [];
                      const itemsCount = saleItems.reduce(
                        (acc: number, it: any) => acc + toNumber(it.quantity),
                        0
                      );

                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900/40 cursor-pointer transition-colors"
                          onClick={() => setSelectedSale(s)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') setSelectedSale(s);
                          }}
                        >
                          <td className="px-4 py-3 text-gray-900 dark:text-white truncate">
                            {formatDateShort((s as any).createdAt)}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200 truncate">
                            {formatPaymentMethod((s as any).paymentMethod)}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200 truncate">
                            {(s as any).customerName || <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                              {itemsCount || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
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
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

          <div className="relative w-full sm:max-w-2xl max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {editMode ? 'Editar venta' : 'Detalle de venta'}
                </p>
                {!editMode && (
                  <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                    {formatDate((selectedSale as any)?.createdAt)} •{' '}
                    {formatPaymentMethod((selectedSale as any)?.paymentMethod)}
                    {(selectedSale as any)?.customerName
                      ? ` • ${(selectedSale as any).customerName}`
                      : ''}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!editMode ? (
                  <>
                    <button
                      type="button"
                      onClick={openEditMode}
                      className="rounded-xl p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      aria-label="Editar"
                      title="Editar venta"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteSale(true)}
                      className="rounded-xl p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                      aria-label="Eliminar"
                      title="Eliminar venta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl p-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-68px)]">
              {/* ── Edit form ── */}
              {editMode && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                      Método de pago
                    </label>
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, paymentMethod: e.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                        Nombre cliente
                      </label>
                      <input
                        value={editForm.customerName}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, customerName: e.target.value }))
                        }
                        placeholder="Opcional"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                        Contacto
                      </label>
                      <input
                        value={editForm.customerContact}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, customerContact: e.target.value }))
                        }
                        placeholder="Tel / email"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={handleEditSave}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold bg-fourth-base text-black disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {savingEdit ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              )}

              {/* ── View mode ── */}
              {!editMode && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedSaleTotal
                          ? formatMoney(selectedSaleTotal, selectedSaleCurrency)
                          : '—'}
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
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Productos
                      </p>
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
                            it?.productName ||
                              it?.product?.name ||
                              p?.name ||
                              p?.title ||
                              'Producto'
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete sale confirm dialog */}
      {confirmDeleteSale && selectedSale && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !deletingSale && setConfirmDeleteSale(false)}
          />
          <div className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Eliminar venta</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                disabled={deletingSale}
                onClick={() => setConfirmDeleteSale(false)}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingSale}
                onClick={handleDeleteSale}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold bg-red-600 text-white disabled:opacity-60"
              >
                {deletingSale ? 'Eliminando…' : 'Eliminar'}
              </button>
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
