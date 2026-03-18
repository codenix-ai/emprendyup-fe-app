'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit2, Lock, RefreshCcw, Save, ShoppingCart, Trash2, X } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Fair, FairSale, FairSummary } from '@/lib/api/fairs';
import { GET_PRODUCTS_BY_STORE } from '@/lib/graphql/queries';
import {
  GET_FAIR,
  GET_FAIR_SALES,
  GET_FAIR_SUMMARY,
  CLOSE_FAIR as CLOSE_FAIR_MUTATION,
  UPDATE_FAIR_SALE,
  DELETE_FAIR_SALE,
} from '@/lib/graphql/fairs';
import { formatMoney, toNumber } from '@/lib/utils/money';
import { SectionLoader } from '@/app/components/Loader';

function safeDate(value?: string | number | null): Date | null {
  if (value === null || value === undefined || value === '') return null;
  // Handle Unix timestamps (ms or s) passed as number or numeric string
  const num =
    typeof value === 'number'
      ? value
      : /^\d{10,13}$/.test(String(value).trim())
        ? Number(value)
        : NaN;
  if (!isNaN(num)) {
    // If 10 digits it's seconds, 13 digits it's milliseconds
    const ms = num < 1e12 ? num * 1000 : num;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(value?: string | number | null): string {
  const d = safeDate(value);
  if (!d) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatDateShort(value?: string | number | null): string {
  const d = safeDate(value);
  if (!d) return '—';
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
  const start = safeDate(fair.startsAt)?.getTime() ?? 0;
  const end = safeDate(fair.endsAt)?.getTime() ?? 0;
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
  total: string;
}

export default function FairDetailPage() {
  const router = useRouter();
  const params = useParams<{ fairId: string }>();
  const fairId = params.fairId;

  const [fair, setFair] = useState<Fair | null>(null);
  const [sales, setSales] = useState<FairSale[]>([]);
  const [summary, setSummary] = useState<FairSummary | null>(null);
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    paymentMethod: 'CASH',
    customerName: '',
    customerContact: '',
    total: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDeleteSale, setConfirmDeleteSale] = useState(false);
  const [deletingSale, setDeletingSale] = useState(false);
  const [activeTab, setActiveTab] = useState<'sales' | 'analytics'>('sales');

  const active = useMemo(() => isFairActive(fair), [fair]);

  const {
    data: fairData,
    loading: fairLoading,
    refetch: refetchFair,
  } = useQuery(GET_FAIR, { variables: { id: fairId }, skip: !fairId });

  const {
    data: salesData,
    loading: salesLoading,
    refetch: refetchSales,
  } = useQuery(GET_FAIR_SALES, { variables: { fairId }, skip: !fairId });

  const {
    data: summaryData,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery(GET_FAIR_SUMMARY, { variables: { fairId }, skip: !fairId });

  useEffect(() => {
    const f: Fair | null = fairData?.fair ?? null;
    setFair(f);
  }, [fairData]);

  useEffect(() => {
    const raw = salesData?.fairSales;
    setSales(Array.isArray(raw) ? raw : []);
  }, [salesData]);

  useEffect(() => {
    const sum = summaryData?.fairSummary;
    setSummary(sum ? normalizeSummary(sum) : null);
  }, [summaryData]);

  const loading = fairLoading || salesLoading || summaryLoading;

  async function load() {
    await Promise.all([refetchFair(), refetchSales(), refetchSummary()]);
  }

  const [closeFairMutation] = useMutation(CLOSE_FAIR_MUTATION);

  async function handleCloseFair() {
    setClosing(true);
    try {
      await closeFairMutation({ variables: { id: fairId } });
      toast.success('Feria cerrada');
      setConfirmClose(false);
      await load();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'No se pudo cerrar la feria');
    } finally {
      setClosing(false);
    }
  }

  function openEditMode() {
    const rawTotal = (selectedSale as any)?.total;
    setEditForm({
      paymentMethod: (selectedSale as any)?.paymentMethod || 'CASH',
      customerName: (selectedSale as any)?.customerName || '',
      customerContact: (selectedSale as any)?.customerContact || '',
      total: rawTotal != null ? String(rawTotal) : '',
    });
    setEditMode(true);
  }

  function closeModal() {
    setSelectedSale(null);
    setEditMode(false);
    setConfirmDeleteSale(false);
  }

  const [updateFairSaleMutation] = useMutation(UPDATE_FAIR_SALE);

  async function handleEditSave() {
    if (!selectedSale?.id) return;
    setSavingEdit(true);
    try {
      const input = {
        paymentMethod: editForm.paymentMethod || undefined,
        customerName: editForm.customerName || undefined,
        customerContact: editForm.customerContact || undefined,
        total: editForm.total ? parseFloat(editForm.total) : undefined,
      };
      const { data } = await updateFairSaleMutation({
        variables: { fairId, saleId: selectedSale.id, input },
      });
      const updated = data?.updateFairSale ?? {};
      toast.success('Venta actualizada');
      setSelectedSale({ ...selectedSale, ...updated });
      setSales((prev) => prev.map((s) => (s.id === selectedSale.id ? { ...s, ...updated } : s)));
      setEditMode(false);
      await refetchSummary();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'No se pudo actualizar la venta');
    } finally {
      setSavingEdit(false);
    }
  }

  const [deleteFairSaleMutation] = useMutation(DELETE_FAIR_SALE);

  async function handleDeleteSale() {
    if (!selectedSale?.id) return;
    setDeletingSale(true);
    try {
      await deleteFairSaleMutation({ variables: { fairId, saleId: selectedSale.id } });
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

  // ── Chart data (sales over time + per-product totals) ──────────────────────
  const analyticsData = useMemo(() => {
    if (!sales.length) return null;

    // Sort chronologically
    const sorted = [...sales].sort((a, b) => {
      const da = safeDate((a as any).createdAt)?.getTime() ?? 0;
      const db = safeDate((b as any).createdAt)?.getTime() ?? 0;
      return da - db;
    });

    // Detect same-day vs multi-day → bucket by hour or by date
    const first = safeDate((sorted[0] as any).createdAt);
    const last = safeDate((sorted[sorted.length - 1] as any).createdAt);
    const sameDay = first && last && first.toDateString() === last.toDateString();

    const bucketKey = (d: Date) =>
      sameDay
        ? `${String(d.getHours()).padStart(2, '0')}:00`
        : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

    // Time-series buckets: { label, total, count, items }
    const timeMap = new Map<
      string,
      { label: string; total: number; count: number; items: number }
    >();
    sorted.forEach((sale) => {
      const d = safeDate((sale as any).createdAt);
      if (!d) return;
      const key = bucketKey(d);
      const existing = timeMap.get(key) ?? { label: key, total: 0, count: 0, items: 0 };
      const saleTotal = toNumber((sale as any).total ?? (sale as any).amount ?? 0);
      const saleItems = Array.isArray((sale as any).items)
        ? (sale as any).items.reduce((s: number, it: any) => s + toNumber(it?.quantity), 0)
        : 0;
      timeMap.set(key, {
        label: key,
        total: existing.total + saleTotal,
        count: existing.count + 1,
        items: existing.items + saleItems,
      });
    });
    const overTime = Array.from(timeMap.values());

    // Per-product totals
    const prodMap = new Map<string, { name: string; qty: number; revenue: number }>();
    sales.forEach((sale) => {
      const items: any[] = Array.isArray((sale as any).items) ? (sale as any).items : [];
      items.forEach((it) => {
        const name = String(
          it?.productName || it?.product?.name || it?.product?.title || 'Producto'
        );
        const qty = toNumber(it?.quantity);
        const price = toNumber(it?.unitPrice ?? it?.product?.price);
        const prev = prodMap.get(name) ?? { name, qty: 0, revenue: 0 };
        prodMap.set(name, { name, qty: prev.qty + qty, revenue: prev.revenue + qty * price });
      });
    });
    const topProducts = [...prodMap.values()]
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, 10);

    // Payment method breakdown
    const methodMap = new Map<string, number>();
    sales.forEach((sale) => {
      const m = formatPaymentMethod((sale as any).paymentMethod);
      methodMap.set(m, (methodMap.get(m) ?? 0) + 1);
    });
    const byMethod = [...methodMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const totalSold = sales.reduce(
      (s, sale) => s + toNumber((sale as any).total ?? (sale as any).amount ?? 0),
      0
    );
    const avgTicket = totalSold / sales.length;

    return { overTime, topProducts, byMethod, totalSold, avgTicket, sameDay };
  }, [sales]);

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
          <SectionLoader text="Cargando ventas..." />
        </div>
      ) : (
        <>
          {/* ── KPI cards ── */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Ticket promedio
              </p>
              <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                {analyticsData ? formatMoney(analyticsData.avgTicket, currency) : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Items vendidos
              </p>
              <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                {analyticsData?.topProducts.reduce((s, p) => s + p.qty, 0) ?? '—'}
              </p>
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div className="mt-4 flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
            {(
              [
                { id: 'sales', label: 'Ventas' },
                { id: 'analytics', label: 'Gráfico' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Chart tab ── */}
          {activeTab === 'analytics' && (
            <div className="mt-4 space-y-4">
              {!analyticsData || analyticsData.overTime.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No hay datos suficientes para mostrar el gráfico.
                </div>
              ) : (
                <>
                  {/* Sales over time */}
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Ventas en el tiempo{' '}
                      <span className="font-normal text-gray-400 text-xs">
                        ({analyticsData.sameDay ? 'por hora' : 'por día'})
                      </span>
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart
                        data={analyticsData.overTime}
                        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => formatMoney(v, currency)}
                          width={72}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          }}
                          formatter={(value: number, name: string) => {
                            if (name === 'total') return [formatMoney(value, currency), 'Total'];
                            return [value, name === 'count' ? 'Ventas' : 'Items'];
                          }}
                          labelStyle={{ fontWeight: 600, color: '#111827' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#eab308"
                          strokeWidth={2.5}
                          fill="url(#totalGrad)"
                          dot={{ fill: '#eab308', r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: '#eab308', strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>

                    {/* Mini time table */}
                    <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-700">
                      {analyticsData.overTime.map((bucket) => (
                        <div
                          key={bucket.label}
                          className="flex items-center justify-between py-2 text-xs"
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-300 w-14">
                            {bucket.label}
                          </span>
                          <div className="flex-1 mx-3">
                            <div
                              className="h-1.5 rounded-full bg-yellow-400"
                              style={{
                                width: `${Math.round((bucket.total / analyticsData.totalSold) * 100)}%`,
                                minWidth: '4px',
                              }}
                            />
                          </div>
                          <span className="text-gray-500 dark:text-gray-400 w-8 text-center">
                            {bucket.count}v
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white w-24 text-right tabular-nums">
                            {formatMoney(bucket.total, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top products */}
                  {analyticsData.topProducts.length > 0 && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Productos más vendidos
                      </h3>
                      <div className="space-y-2">
                        {analyticsData.topProducts.map((prod, i) => {
                          const maxQty = analyticsData.topProducts[0].qty;
                          return (
                            <div key={prod.name} className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-4 flex-none">{i + 1}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                    {prod.name}
                                  </span>
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-2 flex-none">
                                    ×{prod.qty}
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                                  <div
                                    className="h-1.5 rounded-full bg-fourth-base"
                                    style={{ width: `${Math.round((prod.qty / maxQty) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Payment method breakdown */}
                  {analyticsData.byMethod.length > 1 && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Métodos de pago
                      </h3>
                      <div className="space-y-2">
                        {analyticsData.byMethod.map((m) => (
                          <div key={m.name} className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2">
                              <div
                                className="h-1.5 rounded-full bg-gray-900 dark:bg-white"
                                style={{
                                  width: `${Math.round((m.count / sales.length) * 100)}%`,
                                  minWidth: '4px',
                                  maxWidth: '100%',
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 w-28">
                              {m.name}
                            </span>
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 w-6 text-right">
                              {m.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Sales tab ── */}
          {activeTab === 'sales' && (
            <>
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
                  <>
                    {/* ── Mobile card list ── */}
                    <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700/60">
                      {sales.map((s) => {
                        const total = toNumber(
                          (s as any).total ?? (s as any).amount ?? (s as any).totalAmount
                        );
                        const saleItems = Array.isArray((s as any).items) ? (s as any).items : [];
                        return (
                          <button
                            key={s.id}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                            onClick={() => setSelectedSale(s)}
                          >
                            {/* Row 1: date + total */}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDateShort((s as any).createdAt)}
                              </span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {total ? formatMoney(total, (s as any).currency || currency) : '—'}
                              </span>
                            </div>
                            {/* Row 2: products */}
                            <div className="mb-1">
                              {saleItems.length === 0 ? (
                                <span className="text-xs text-gray-400">Sin productos</span>
                              ) : (
                                <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
                                  {saleItems
                                    .slice(0, 2)
                                    .map((it: any) => {
                                      const name = String(
                                        it?.productName ||
                                          it?.product?.name ||
                                          it?.product?.title ||
                                          'Producto'
                                      );
                                      const qty = toNumber(it?.quantity);
                                      return qty > 1 ? `${name} ×${qty}` : name;
                                    })
                                    .join(', ')}
                                  {saleItems.length > 2 && (
                                    <span className="text-gray-400">
                                      {' '}
                                      +{saleItems.length - 2} más
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                            {/* Row 3: method + customer */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                                {formatPaymentMethod((s as any).paymentMethod)}
                              </span>
                              {(s as any).customerName && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {(s as any).customerName}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* ── Desktop table ── */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full table-fixed text-sm">
                        <colgroup>
                          <col className="w-[18%]" />
                          <col className="w-[14%]" />
                          <col className="w-[16%]" />
                          <col className="w-[36%]" />
                          <col className="w-[16%]" />
                        </colgroup>
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/60 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3">Método</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Productos</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                          {sales.map((s) => {
                            const total = toNumber(
                              (s as any).total ?? (s as any).amount ?? (s as any).totalAmount
                            );
                            const saleItems = Array.isArray((s as any).items)
                              ? (s as any).items
                              : [];

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
                                  {(s as any).customerName || (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {saleItems.length === 0 ? (
                                    <span className="text-gray-400">—</span>
                                  ) : (
                                    <div className="space-y-0.5">
                                      {saleItems.slice(0, 2).map((it: any, idx: number) => {
                                        const name = String(
                                          it?.productName ||
                                            it?.product?.name ||
                                            it?.product?.title ||
                                            'Producto'
                                        );
                                        const qty = toNumber(it?.quantity);
                                        return (
                                          <p
                                            key={idx}
                                            className="text-xs text-gray-700 dark:text-gray-200 truncate leading-snug"
                                          >
                                            <span className="font-medium">{name}</span>
                                            {qty > 0 && (
                                              <span className="text-gray-400"> ×{qty}</span>
                                            )}
                                          </p>
                                        );
                                      })}
                                      {saleItems.length > 2 && (
                                        <p className="text-xs text-gray-400">
                                          +{saleItems.length - 2} más
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                  {total
                                    ? formatMoney(total, (s as any).currency || currency)
                                    : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
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
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                      Total
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.total}
                        onChange={(e) => setEditForm((f) => ({ ...f, total: e.target.value }))}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-7 pr-3 py-2.5 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
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
