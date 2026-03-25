'use client';

import { useState, useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useSessionStore } from '@/lib/store/dashboard';
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const GET_SERVICES = gql`
  query GetServiceCatalog($serviceProviderId: String!) {
    servicesByProvider(serviceProviderId: $serviceProviderId) {
      id
      name
      description
      durationMinutes
      priceAmount
      currency
      allowsOnlinePayment
      isActive
      createdAt
    }
  }
`;

const CREATE_SERVICE = gql`
  mutation CreateServiceCatalog($data: CreateServiceInput!) {
    createService(data: $data) {
      id
      name
      description
      durationMinutes
      priceAmount
      currency
      allowsOnlinePayment
      isActive
      createdAt
    }
  }
`;

const UPDATE_SERVICE = gql`
  mutation UpdateServiceCatalog($id: String!, $data: UpdateServiceInput!) {
    updateService(id: $id, data: $data) {
      id
      name
      description
      durationMinutes
      priceAmount
      currency
      allowsOnlinePayment
      isActive
    }
  }
`;

const DELETE_SERVICE = gql`
  mutation DeleteServiceCatalog($id: String!) {
    deleteService(id: $id)
  }
`;

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceAmount: number;
  currency: string;
  allowsOnlinePayment: boolean;
  isActive: boolean;
  createdAt: string;
}

interface ServiceForm {
  name: string;
  description: string;
  durationMinutes: number;
  priceAmount: number;
  currency: string;
  allowsOnlinePayment: boolean;
  isActive: boolean;
}

const EMPTY_FORM: ServiceForm = {
  name: '',
  description: '',
  durationMinutes: 60,
  priceAmount: 0,
  currency: 'COP',
  allowsOnlinePayment: false,
  isActive: true,
};

const formatPrice = (n: number, currency = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);

export default function ServiceCatalog() {
  const { user } = useSessionStore();
  const serviceProviderId = user?.serviceProviderId;

  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_SERVICES, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  const [createService] = useMutation(CREATE_SERVICE);
  const [updateService] = useMutation(UPDATE_SERVICE);
  const [deleteService] = useMutation(DELETE_SERVICE);

  const services: Service[] = useMemo(() => data?.servicesByProvider || [], [data]);

  const filtered = useMemo(() => {
    let list = services;
    if (filterActive === 'active') list = list.filter((s) => s.isActive);
    if (filterActive === 'inactive') list = list.filter((s) => !s.isActive);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [services, filterActive, search]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalMode('create');
  };

  const openEdit = (s: Service) => {
    setForm({
      name: s.name,
      description: s.description || '',
      durationMinutes: s.durationMinutes,
      priceAmount: s.priceAmount,
      currency: s.currency,
      allowsOnlinePayment: s.allowsOnlinePayment,
      isActive: s.isActive,
    });
    setEditingId(s.id);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre del servicio es obligatorio');
      return;
    }
    setSaving(true);
    try {
      if (modalMode === 'create') {
        await createService({
          variables: {
            data: {
              serviceProviderId,
              name: form.name.trim(),
              description: form.description.trim() || undefined,
              durationMinutes: Number(form.durationMinutes),
              priceAmount: Number(form.priceAmount),
              currency: form.currency,
              allowsOnlinePayment: form.allowsOnlinePayment,
              isActive: form.isActive,
            },
          },
        });
        toast.success('Servicio creado exitosamente');
      } else {
        await updateService({
          variables: {
            id: editingId,
            data: {
              name: form.name.trim(),
              description: form.description.trim() || undefined,
              durationMinutes: Number(form.durationMinutes),
              priceAmount: Number(form.priceAmount),
              currency: form.currency,
              allowsOnlinePayment: form.allowsOnlinePayment,
              isActive: form.isActive,
            },
          },
        });
        toast.success('Servicio actualizado exitosamente');
      }
      await refetch();
      closeModal();
    } catch {
      toast.error('Error al guardar el servicio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteService({ variables: { id } });
      toast.success('Servicio eliminado');
      await refetch();
      setDeleteConfirmId(null);
    } catch {
      toast.error('Error al eliminar el servicio');
    } finally {
      setDeleting(false);
    }
  };

  const updateField = <K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (!serviceProviderId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-gray-500">No se encontró el proveedor de servicios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Catálogo de Servicios
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Administra los servicios que ofreces</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Nuevo Servicio
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fourth-base"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                filterActive === f
                  ? 'bg-fourth-base text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Servicios', value: services.length, icon: DollarSign, color: 'blue' },
          {
            label: 'Activos',
            value: services.filter((s) => s.isActive).length,
            icon: CheckCircle,
            color: 'green',
          },
          {
            label: 'Inactivos',
            value: services.filter((s) => !s.isActive).length,
            icon: XCircle,
            color: 'red',
          },
          {
            label: 'Precio Promedio',
            value: services.length
              ? formatPrice(services.reduce((a, s) => a + s.priceAmount, 0) / services.length)
              : '—',
            icon: DollarSign,
            color: 'purple',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3"
          >
            <div className={`p-2.5 rounded-full bg-${color}-100 dark:bg-${color}-900/30`}>
              <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fourth-base" />
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Error al cargar los servicios: {error.message}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {search || filterActive !== 'all'
              ? 'No se encontraron servicios con los filtros aplicados.'
              : 'Aún no tienes servicios. ¡Crea el primero!'}
          </p>
          {!search && filterActive === 'all' && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Crear Servicio
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {['Servicio', 'Duración', 'Precio', 'Pago Online', 'Estado', ''].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${
                        h === '' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {s.name}
                      </div>
                      {s.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs truncate">
                          {s.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {s.durationMinutes} min
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-fourth-base">
                        {formatPrice(s.priceAmount, s.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.allowsOnlinePayment ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Check className="h-3 w-3" /> Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          <X className="h-3 w-3" /> No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          <XCircle className="h-3 w-3" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-fourth-base hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(s.id)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalMode === 'create' ? 'Nuevo Servicio' : 'Editar Servicio'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ej: Corte de cabello"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fourth-base"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Descripción opcional del servicio..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fourth-base resize-none"
                />
              </div>

              {/* Duration + Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.durationMinutes}
                    onChange={(e) => updateField('durationMinutes', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fourth-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.priceAmount}
                    onChange={(e) => updateField('priceAmount', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fourth-base"
                  />
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Moneda
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fourth-base"
                >
                  <option value="COP">COP – Peso Colombiano</option>
                  <option value="USD">USD – Dólar Americano</option>
                  <option value="MXN">MXN – Peso Mexicano</option>
                  <option value="PEN">PEN – Sol Peruano</option>
                  <option value="ARS">ARS – Peso Argentino</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pt-2">
                  Opciones
                </p>
                {[
                  {
                    key: 'allowsOnlinePayment' as const,
                    label: 'Permite pago online',
                    desc: 'El cliente puede pagar al reservar',
                  },
                  {
                    key: 'isActive' as const,
                    label: 'Servicio activo',
                    desc: 'Visible para los clientes al reservar',
                  },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField(key, !form[key])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        form[key] ? 'bg-fourth-base' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          form[key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-fourth-base rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {modalMode === 'create' ? 'Crear' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Eliminar servicio
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Esta acción no se puede deshacer. El servicio será eliminado permanentemente.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
