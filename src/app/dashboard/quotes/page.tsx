'use client';

import React, { useState, useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useSessionStore } from '@/lib/store/dashboard';
import {
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Package,
  Clock,
  User,
  Mail,
  Building2,
  MapPin,
  Phone,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

// ─── GraphQL ────────────────────────────────────────────────────────────────

const QUOTES_BY_STORE = gql`
  query QuotesByStore($storeId: ID!) {
    quotesByStore(storeId: $storeId) {
      id
      referencia
      nombreEmpresa
      nombreContacto
      correoElectronico
      estado
      origen
      fechaSolicitud
      createdAt
      items {
        id
        productName
        quantity
        unit
      }
      history {
        estadoNuevo
        accion
        fechaCambio
      }
    }
  }
`;

const GET_QUOTE = gql`
  query Quote($id: ID!) {
    quote(id: $id) {
      id
      referencia
      nombreEmpresa
      industria
      ciudad
      volumenEstimado
      nombreContacto
      correoElectronico
      telefono
      requerimientosAdicionales
      estado
      notas
      origen
      fechaSolicitud
      storeId
      createdAt
      updatedAt
      items {
        id
        productName
        productCategory
        quantity
        unit
        productSku
        posicion
      }
      history {
        id
        estadoAnterior
        estadoNuevo
        accion
        descripcion
        fechaCambio
      }
    }
  }
`;

const UPDATE_QUOTE = gql`
  mutation UpdateQuote($id: ID!, $input: UpdateQuoteInput!) {
    updateQuote(id: $id, input: $input) {
      id
      referencia
      estado
      notas
      updatedAt
      history {
        id
        estadoAnterior
        estadoNuevo
        accion
        descripcion
        fechaCambio
      }
    }
  }
`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuoteItem {
  id: string;
  productName: string;
  productCategory?: string;
  quantity: number;
  unit: string;
  productSku?: string;
  posicion?: number;
}

interface QuoteHistory {
  id?: string;
  estadoAnterior?: string;
  estadoNuevo: string;
  accion: string;
  descripcion?: string;
  fechaCambio: string;
}

interface Quote {
  id: string;
  referencia: string;
  nombreEmpresa: string;
  industria?: string;
  ciudad?: string;
  volumenEstimado?: string;
  nombreContacto: string;
  correoElectronico: string;
  telefono?: string;
  requerimientosAdicionales?: string;
  estado: string;
  notas?: string;
  origen: string;
  fechaSolicitud: string;
  storeId?: string;
  createdAt: string;
  updatedAt?: string;
  items: QuoteItem[];
  history: QuoteHistory[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  CONTACTADO: 'bg-blue-100 text-blue-800',
  GANADO: 'bg-green-100 text-green-800',
  PERDIDO: 'bg-red-100 text-red-800',
  EN_PROCESO: 'bg-indigo-100 text-indigo-800',
  COMPLETADO: 'bg-green-200 text-green-900',
  RECHAZADO: 'bg-red-200 text-red-900',
  CANCELADO: 'bg-gray-100 text-gray-700',
  APROVADO_POR_CLIENTE: 'bg-teal-100 text-teal-800',
  PENDIENTE_DE_ENVIO_COTIZACION: 'bg-orange-100 text-orange-800',
  COTIZACION_ENVIADA: 'bg-cyan-100 text-cyan-800',
  PENDIENTE_DE_CONFIRMACION: 'bg-purple-100 text-purple-800',
  CONFIRMADO: 'bg-emerald-100 text-emerald-800',
};

function StatusBadge({ estado }: { estado: string }) {
  const cls = STATUS_COLORS[estado] ?? 'bg-gray-100 text-gray-700';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {estado}
    </span>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function QuoteDetailModal({ quoteId, onClose }: { quoteId: string; onClose: () => void }) {
  const { data, loading, error, refetch } = useQuery(GET_QUOTE, {
    variables: { id: quoteId },
    fetchPolicy: 'network-only',
  });

  const [updateQuote, { loading: updating }] = useMutation(UPDATE_QUOTE);

  const [updateForm, setUpdateForm] = useState({
    estado: '',
    accion: '',
    descripcion: '',
    notas: '',
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const QUOTE_STATES: { value: string; label: string }[] = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'CONTACTADO', label: 'Contactado' },
    { value: 'PENDIENTE_DE_ENVIO_COTIZACION', label: 'Pendiente de envío de cotización' },
    { value: 'COTIZACION_ENVIADA', label: 'Cotización enviada' },
    { value: 'PENDIENTE_DE_CONFIRMACION', label: 'Pendiente de confirmación' },
    { value: 'APROVADO_POR_CLIENTE', label: 'Aprobado por cliente' },
    { value: 'CONFIRMADO', label: 'Confirmado' },
    { value: 'EN_PROCESO', label: 'En proceso' },
    { value: 'GANADO', label: 'Ganado' },
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'PERDIDO', label: 'Perdido' },
    { value: 'RECHAZADO', label: 'Rechazado' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ];

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess(false);
    const input: Record<string, string> = { accion: updateForm.accion };
    if (updateForm.estado) input.estado = updateForm.estado;
    if (updateForm.descripcion) input.descripcion = updateForm.descripcion;
    if (updateForm.notas) input.notas = updateForm.notas;
    try {
      await updateQuote({ variables: { id: quoteId, input } });
      setUpdateSuccess(true);
      setUpdateForm({ estado: '', accion: '', descripcion: '', notas: '' });
      refetch();
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  }

  const quote: Quote | undefined = data?.quote;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-fourth-base text-black">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">
                {quote ? `Cotización ${quote.referencia}` : 'Detalle de cotización'}
              </h2>
              {quote && <p className="text-sm text-gray-800">{quote.nombreEmpresa}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/30 border border-red-700 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Error al cargar la cotización: {error.message}</p>
            </div>
          )}

          {quote && (
            <div className="space-y-6">
              {/* Status + meta */}
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge estado={quote.estado} />
                <span className="text-sm text-gray-400">Origen: {quote.origen}</span>
                <span className="text-sm text-gray-400">
                  Solicitada: {formatDate(quote.fechaSolicitud)}
                </span>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={<User className="w-4 h-4" />}
                  label="Contacto"
                  value={quote.nombreContacto}
                />
                <InfoRow
                  icon={<Mail className="w-4 h-4" />}
                  label="Correo"
                  value={quote.correoElectronico}
                />
                {quote.telefono && (
                  <InfoRow
                    icon={<Phone className="w-4 h-4" />}
                    label="Teléfono"
                    value={quote.telefono}
                  />
                )}
                {quote.industria && (
                  <InfoRow
                    icon={<Building2 className="w-4 h-4" />}
                    label="Industria"
                    value={quote.industria}
                  />
                )}
                {quote.ciudad && (
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    label="Ciudad"
                    value={quote.ciudad}
                  />
                )}
                {quote.volumenEstimado && (
                  <InfoRow
                    icon={<Package className="w-4 h-4" />}
                    label="Volumen estimado"
                    value={quote.volumenEstimado}
                  />
                )}
              </div>

              {/* Additional requirements */}
              {quote.requerimientosAdicionales && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-1">
                    Requerimientos adicionales
                  </h3>
                  <p className="text-sm text-gray-400 bg-gray-800 border border-gray-700 rounded-lg p-3">
                    {quote.requerimientosAdicionales}
                  </p>
                </div>
              )}

              {/* Notes */}
              {quote.notas && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-1">Notas</h3>
                  <p className="text-sm text-gray-400 bg-gray-800 border border-gray-700 rounded-lg p-3">
                    {quote.notas}
                  </p>
                </div>
              )}

              {/* Items */}
              {quote.items?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-400" />
                    Productos solicitados ({quote.items.length})
                  </h3>
                  <div className="overflow-x-auto rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase">
                            #
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase">
                            Producto
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase">
                            Categoría
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase">
                            Cant.
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase">
                            Unidad
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase">
                            SKU
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-900 divide-y divide-gray-800">
                        {quote.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-gray-800">
                            <td className="px-4 py-2 text-gray-400">{item.posicion ?? idx + 1}</td>
                            <td className="px-4 py-2 font-semibold text-white">
                              {item.productName}
                            </td>
                            <td className="px-4 py-2 text-gray-400">
                              {item.productCategory ?? '—'}
                            </td>
                            <td className="px-4 py-2 text-gray-400">{item.quantity}</td>
                            <td className="px-4 py-2 text-gray-400">{item.unit}</td>
                            <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                              {item.productSku ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Update state form */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-gray-200">Actualizar cotización</h3>
                </div>
                <form onSubmit={handleUpdate} className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Nuevo estado <span className="text-gray-500">(opcional)</span>
                      </label>
                      <select
                        value={updateForm.estado}
                        onChange={(e) => setUpdateForm((f) => ({ ...f, estado: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">— Sin cambio —</option>
                        {QUOTE_STATES.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Acción <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Primer contacto realizado"
                        value={updateForm.accion}
                        onChange={(e) => setUpdateForm((f) => ({ ...f, accion: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Descripción
                    </label>
                    <input
                      type="text"
                      placeholder="Detalles del cambio…"
                      value={updateForm.descripcion}
                      onChange={(e) =>
                        setUpdateForm((f) => ({ ...f, descripcion: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Notas internas
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Notas visibles sólo para el equipo…"
                      value={updateForm.notas}
                      onChange={(e) => setUpdateForm((f) => ({ ...f, notas: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {updateError && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {updateError}
                    </div>
                  )}
                  {updateSuccess && (
                    <div className="flex items-center gap-2 text-green-400 bg-green-900/30 border border-green-700 rounded-lg px-3 py-2 text-xs">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      Cotización actualizada correctamente.
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {updating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Guardar cambios
                    </button>
                  </div>
                </form>
              </div>

              {/* History */}
              {quote.history?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Historial de cambios
                  </h3>
                  <ol className="relative border-l border-gray-700 space-y-4 ml-3">
                    {quote.history.map((h, idx) => (
                      <li key={h.id ?? idx} className="ml-4">
                        <div className="absolute w-2.5 h-2.5 bg-indigo-500 rounded-full -left-1.5 mt-1" />
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                          <p className="text-xs font-semibold text-indigo-400">{h.accion}</p>
                          {h.estadoAnterior && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {h.estadoAnterior} → {h.estadoNuevo}
                            </p>
                          )}
                          {h.descripcion && (
                            <p className="text-xs text-gray-400 mt-1">{h.descripcion}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{formatDate(h.fechaCambio)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-500">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-200">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function QuotesPage() {
  const { currentStore } = useSessionStore();
  const userData =
    typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  const storeId = userData?.storeId || currentStore?.id || '';

  const { data, loading, error } = useQuery(QUOTES_BY_STORE, {
    variables: { storeId },
    skip: !storeId,
    fetchPolicy: 'network-only',
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'createdAt' | 'referencia' | 'nombreEmpresa'>(
    'createdAt'
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const allQuotes: Quote[] = data?.quotesByStore ?? [];

  const statuses = useMemo(
    () => Array.from(new Set(allQuotes.map((q) => q.estado))).filter(Boolean),
    [allQuotes]
  );

  const filtered = useMemo(() => {
    let result = [...allQuotes];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.referencia?.toLowerCase().includes(q) ||
          r.nombreEmpresa?.toLowerCase().includes(q) ||
          r.nombreContacto?.toLowerCase().includes(q) ||
          r.correoElectronico?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.estado === statusFilter);
    }
    result.sort((a, b) => {
      const va = a[sortField] ?? '';
      const vb = b[sortField] ?? '';
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return result;
  }, [allQuotes, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <FileText className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-sm text-gray-500">Solicitudes de cotización de tu tienda</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por empresa, contacto o referencia…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5  text-black border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="all">Todos los estados</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* State: no storeId */}
      {!storeId && (
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">No se encontró una tienda asociada a tu cuenta.</p>
        </div>
      )}

      {/* State: loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      )}

      {/* State: error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Error al cargar cotizaciones: {error.message}</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && storeId && (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase cursor-pointer hover:text-white"
                    onClick={() => toggleSort('referencia')}
                  >
                    Referencia <SortIcon field="referencia" />
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase cursor-pointer hover:text-white"
                    onClick={() => toggleSort('nombreEmpresa')}
                  >
                    Empresa <SortIcon field="nombreEmpresa" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase">
                    Productos
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase cursor-pointer hover:text-white"
                    onClick={() => toggleSort('createdAt')}
                  >
                    Fecha <SortIcon field="createdAt" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase">
                    Origen
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase">
                    Último movimiento
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center text-gray-500">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No hay cotizaciones que coincidan con tu búsqueda.</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-300">
                        {quote.referencia}
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">{quote.nombreEmpresa}</td>
                      <td className="px-6 py-4">
                        <p className="text-gray-200">{quote.nombreContacto}</p>
                        <p className="text-xs text-gray-400">{quote.correoElectronico}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge estado={quote.estado} />
                      </td>
                      <td className="px-6 py-4 text-gray-400">{quote.items?.length ?? 0}</td>
                      <td className="px-6 py-4 text-gray-400">{formatDate(quote.createdAt)}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{quote.origen}</td>
                      <td className="px-6 py-4">
                        {(() => {
                          const last = quote.history?.[quote.history.length - 1];
                          if (!last) return <span className="text-gray-600 text-xs">—</span>;
                          return (
                            <div>
                              <p className="text-xs font-medium text-gray-300">{last.accion}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(last.fechaCambio)}
                              </p>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedQuoteId(quote.id)}
                          className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="lg:hidden space-y-3">
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-500">
                <FileText className="w-10 h-10 mb-2 opacity-30" />
                <p>No hay cotizaciones que coincidan con tu búsqueda.</p>
              </div>
            ) : (
              paginated.map((quote) => {
                const lastHistory = quote.history?.[quote.history.length - 1];
                return (
                  <div
                    key={quote.id}
                    className="p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-sm"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-xs text-gray-400 mb-0.5">{quote.referencia}</p>
                        <h3 className="text-sm font-semibold text-white">{quote.nombreEmpresa}</h3>
                        <p className="text-xs text-gray-400">{quote.nombreContacto}</p>
                      </div>
                      <StatusBadge estado={quote.estado} />
                    </div>

                    {/* Meta row */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
                      <div>
                        <span className="text-gray-500">Origen: </span>
                        <span className="text-gray-300">{quote.origen}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Productos: </span>
                        <span className="text-gray-300">{quote.items?.length ?? 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fecha: </span>
                        <span className="text-gray-300">{formatDate(quote.createdAt)}</span>
                      </div>
                      {lastHistory && (
                        <div>
                          <span className="text-gray-500">Último mov.: </span>
                          <span className="text-gray-300">{lastHistory.accion}</span>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setSelectedQuoteId(quote.id)}
                        className="px-4 py-2 bg-fourth-base text-black text-sm font-medium rounded-lg hover:bg-fourth-base/90 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver detalle
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-400">
              <p>
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}{' '}
                de {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selectedQuoteId && (
        <QuoteDetailModal quoteId={selectedQuoteId} onClose={() => setSelectedQuoteId(null)} />
      )}
    </div>
  );
}
