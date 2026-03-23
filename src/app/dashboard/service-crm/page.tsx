'use client';

import { useState, useMemo, useRef } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useSessionStore } from '@/lib/store/dashboard';
import {
  Users,
  Star,
  Crown,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  AlertCircle,
  Pencil,
  X,
  Save,
  UserPlus,
  Loader2,
  MessageCircle,
  CreditCard,
  ChevronDown as ChevronDownIcon,
} from 'lucide-react';

const GET_ALL_APPOINTMENTS = gql`
  query GetAllAppointmentsCRM($serviceProviderId: String!) {
    appointmentsByProvider(serviceProviderId: $serviceProviderId) {
      id
      serviceId
      customerName
      customerEmail
      customerPhone
      startDatetime
      endDatetime
      status
      paymentStatus
      notes
      serviceAddress
      serviceCity
      serviceReference
      createdAt
    }
  }
`;

const GET_SERVICES = gql`
  query GetServicesCRM($serviceProviderId: String!) {
    servicesByProvider(serviceProviderId: $serviceProviderId) {
      id
      name
      priceAmount
    }
  }
`;

const UPDATE_APPOINTMENT_PAYMENT = gql`
  mutation UpdateAppointmentPayment($id: String!, $data: UpdateAppointmentInput!) {
    updateAppointment(id: $id, data: $data) {
      id
      paymentStatus
    }
  }
`;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  NEQUI: 'Nequi',
  DAVIPLATA: 'Daviplata',
  PSE: 'PSE',
  OTHER: 'Otro',
};

const CREATE_APPOINTMENT_CRM = gql`
  mutation CreateAppointmentCRM($data: CreateAppointmentInput!) {
    createAppointment(data: $data) {
      id
      customerName
      customerEmail
      customerPhone
      startDatetime
      endDatetime
    }
  }
`;

const UPDATE_CLIENT_APPOINTMENTS = gql`
  mutation UpdateClientContact($id: String!, $data: UpdateAppointmentInput!) {
    updateAppointment(id: $id, data: $data) {
      id
      customerName
      customerEmail
      customerPhone
    }
  }
`;

interface AppointmentHistory {
  id: string;
  date: string;
  serviceName: string;
  status: string;
  paymentStatus: string;
  amount: number;
}

interface FrequentClient {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAppointments: number;
  totalRevenue: number;
  lastAppointmentDate: string;
  firstAppointmentDate: string;
  isRecurrent: boolean;
  isVIP: boolean;
  appointmentHistory: AppointmentHistory[];
}

interface Appointment {
  id: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDatetime: string;
  endDatetime: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  notes?: string;
  serviceAddress?: string;
  serviceCity?: string;
  serviceReference?: string;
  createdAt: string;
}

interface EditClientForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

interface NewClientForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerWhatsapp: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
}

interface Service {
  id: string;
  name: string;
  priceAmount: number;
  durationMinutes?: number;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

const parseFlexDate = (val: string): Date => {
  const n = Number(val);
  return isNaN(n) ? new Date(val) : new Date(n);
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  CANCELLED_BY_CLIENT: 'Cancelada (cliente)',
  CANCELLED_BY_PROVIDER: 'Cancelada (proveedor)',
  COMPLETED: 'Completada',
};
const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PARTIAL: 'Parcial',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

type SortKey = 'totalAppointments' | 'totalRevenue' | 'lastAppointmentDate';

export default function ServiceCRM() {
  const { user } = useSessionStore();
  const serviceProviderId = user?.serviceProviderId;

  const [sortKey, setSortKey] = useState<SortKey>('totalAppointments');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'clients' | 'appointments'>('clients');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'vip'>('all');

  const [editingClient, setEditingClient] = useState<FrequentClient | null>(null);
  const [editForm, setEditForm] = useState<EditClientForm>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const editNameRef = useRef<HTMLInputElement>(null);

  const [updateClientMutation] = useMutation(UPDATE_CLIENT_APPOINTMENTS);
  const [updatePaymentMutation] = useMutation(UPDATE_APPOINTMENT_PAYMENT);
  const [createAppointmentMutation] = useMutation(CREATE_APPOINTMENT_CRM);

  const [editingPayment, setEditingPayment] = useState<{
    aptId: string;
    status: string;
    method: string;
  } | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);

  const openPaymentEditor = (
    e: React.MouseEvent,
    apt: { id: string; paymentStatus: string; paymentMethod?: string }
  ) => {
    e.stopPropagation();
    setEditingPayment({
      aptId: apt.id,
      status: apt.paymentStatus,
      method: apt.paymentMethod ?? '',
    });
  };

  const handleSavePayment = async () => {
    if (!editingPayment) return;
    setPaymentSaving(true);
    try {
      await updatePaymentMutation({
        variables: {
          id: editingPayment.aptId,
          data: {
            paymentStatus: editingPayment.status,
            ...(editingPayment.method ? { paymentMethod: editingPayment.method } : {}),
          },
        },
      });
      await refetchAppointments();
      setEditingPayment(null);
    } catch (err) {
      console.error('Error updating payment:', err);
    } finally {
      setPaymentSaving(false);
    }
  };

  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState<NewClientForm>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerWhatsapp: '',
    serviceId: '',
    appointmentDate: '',
    appointmentTime: '09:00',
    notes: '',
  });
  const [newClientSaving, setNewClientSaving] = useState(false);
  const [newClientError, setNewClientError] = useState<string | null>(null);

  const handleNewClientChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewClientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateClient = async () => {
    if (!newClientForm.customerName.trim()) {
      setNewClientError('El nombre es requerido');
      return;
    }
    if (!newClientForm.customerEmail.trim()) {
      setNewClientError('El email es requerido');
      return;
    }
    if (!newClientForm.serviceId) {
      setNewClientError('Selecciona un servicio');
      return;
    }
    if (!newClientForm.appointmentDate) {
      setNewClientError('Selecciona una fecha');
      return;
    }

    setNewClientSaving(true);
    setNewClientError(null);

    try {
      const startDate = new Date(
        `${newClientForm.appointmentDate}T${newClientForm.appointmentTime}:00`
      );
      const service = servicesData?.servicesByProvider?.find(
        (s: Service) => s.id === newClientForm.serviceId
      );
      const durationMs = (service?.durationMinutes ?? 60) * 60000;
      const endDate = new Date(startDate.getTime() + durationMs);

      await createAppointmentMutation({
        variables: {
          data: {
            serviceProviderId,
            serviceId: newClientForm.serviceId,
            customerName: newClientForm.customerName.trim(),
            customerEmail: newClientForm.customerEmail.trim(),
            customerPhone: newClientForm.customerPhone.trim() || undefined,
            customerWhatsappNumber: newClientForm.customerWhatsapp.trim() || undefined,
            startDatetime: startDate.toISOString(),
            endDatetime: endDate.toISOString(),
            notes: newClientForm.notes.trim() || undefined,
          },
        },
      });

      await refetchAppointments();
      setIsNewClientOpen(false);
      setNewClientForm({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerWhatsapp: '',
        serviceId: '',
        appointmentDate: '',
        appointmentTime: '09:00',
        notes: '',
      });
    } catch (err: unknown) {
      const msg =
        (err as { graphQLErrors?: { message: string }[] })?.graphQLErrors?.[0]?.message ||
        (err as Error)?.message ||
        'Error al crear el cliente';
      setNewClientError(msg);
    } finally {
      setNewClientSaving(false);
    }
  };

  // Calculate date range based on selection
  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    let from = new Date();
    let to = new Date();

    switch (dateRange) {
      case 'week':
        // Esta semana completa (lunes a domingo)
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        from = new Date(now.getFullYear(), now.getMonth(), diff);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(from.getDate() + 6); // Hasta el domingo
        to.setHours(23, 59, 59, 999);
        break;

      case 'month':
        // Todo el mes actual (del 1 al último día)
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último día del mes
        to.setHours(23, 59, 59, 999);
        break;

      case 'all':
        // Todas las citas (sin restricción de fecha)
        from = new Date('2000-01-01');
        from.setHours(0, 0, 0, 0);
        to = new Date('2099-12-31');
        to.setHours(23, 59, 59, 999);
        break;
    }

    return {
      dateFrom: from.toISOString().split('T')[0],
      dateTo: to.toISOString().split('T')[0],
    };
  }, [dateRange]);

  // frequentClients endpoint not available — derive clients from appointments
  const loadingClients = false;

  const {
    data: appointmentsData,
    loading: loadingAppointments,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useQuery(GET_ALL_APPOINTMENTS, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clients = useMemo((): FrequentClient[] => [], []);

  const appointments: Appointment[] = useMemo(
    () => appointmentsData?.appointmentsByProvider || [],
    [appointmentsData]
  );

  const services: Service[] = useMemo(() => servicesData?.servicesByProvider || [], [servicesData]);

  // Fallback: derive clients from appointmentsByProvider when frequentClients is empty or errored
  const derivedClients = useMemo((): FrequentClient[] => {
    if (clients.length > 0) return [];
    if (!appointments.length) return [];

    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    const rangeApts = appointments.filter((apt) => {
      const aptDate = parseFlexDate(apt.startDatetime);
      return aptDate >= from && aptDate <= to;
    });

    const clientMap = new Map<string, FrequentClient>();

    for (const apt of rangeApts) {
      const key = apt.customerEmail || apt.customerName;
      const service = services.find((s) => s.id === apt.serviceId);
      const amount = service?.priceAmount || 0;

      const aptIso = parseFlexDate(apt.startDatetime).toISOString();

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          customerId: apt.customerEmail,
          customerName: apt.customerName,
          customerEmail: apt.customerEmail,
          customerPhone: apt.customerPhone,
          totalAppointments: 0,
          totalRevenue: 0,
          lastAppointmentDate: aptIso,
          firstAppointmentDate: aptIso,
          isRecurrent: false,
          isVIP: false,
          appointmentHistory: [],
        });
      }

      const client = clientMap.get(key)!;
      client.totalAppointments++;
      client.totalRevenue += amount;
      client.appointmentHistory.push({
        id: apt.id,
        date: aptIso,
        serviceName: service?.name || '',
        status: apt.status,
        paymentStatus: apt.paymentStatus,
        amount,
      });

      const aptTime = parseFlexDate(apt.startDatetime).getTime();
      if (aptTime > parseFlexDate(client.lastAppointmentDate).getTime())
        client.lastAppointmentDate = aptIso;
      if (aptTime < parseFlexDate(client.firstAppointmentDate).getTime())
        client.firstAppointmentDate = aptIso;
    }

    const list = Array.from(clientMap.values());
    list.forEach((c) => {
      c.isRecurrent = c.totalAppointments > 1;
    });

    if (list.length > 0) {
      list.sort((a, b) => b.totalAppointments - a.totalAppointments);
      const vipCount = Math.max(1, Math.ceil(list.length * 0.1));
      for (let i = 0; i < vipCount; i++) list[i].isVIP = true;
    }

    return list;
  }, [clients, appointments, services, dateFrom, dateTo]);

  const effectiveClients = clients.length > 0 ? clients : derivedClients;

  // Filter appointments by date range
  const filteredAppointments = useMemo(() => {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    return appointments
      .filter((apt) => {
        const aptDate = parseFlexDate(apt.startDatetime);
        return aptDate >= from && aptDate <= to;
      })
      .sort((a, b) => {
        return parseFlexDate(b.startDatetime).getTime() - parseFlexDate(a.startDatetime).getTime();
      });
  }, [appointments, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    let list = effectiveClients;
    if (filterType === 'recurring') list = list.filter((c) => c.isRecurrent);
    if (filterType === 'vip') list = list.filter((c) => c.isVIP);
    return list.sort((a, b) => {
      let diff = 0;
      if (sortKey === 'totalAppointments') diff = a.totalAppointments - b.totalAppointments;
      if (sortKey === 'totalRevenue') diff = a.totalRevenue - b.totalRevenue;
      if (sortKey === 'lastAppointmentDate') {
        diff =
          parseFlexDate(a.lastAppointmentDate).getTime() -
          parseFlexDate(b.lastAppointmentDate).getTime();
      }
      return sortDir === 'desc' ? -diff : diff;
    });
  }, [effectiveClients, filterType, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleExportCSV = () => {
    if (viewMode === 'clients') {
      const headers = [
        'Nombre',
        'Correo',
        'Teléfono',
        'Total Citas',
        'Ingresos Totales',
        'Primera Visita',
        'Última Visita',
        'Tipo',
      ];
      const rows = filtered.map((c) => [
        c.customerName,
        c.customerEmail,
        c.customerPhone,
        c.totalAppointments,
        c.totalRevenue,
        parseFlexDate(c.firstAppointmentDate).toLocaleDateString('es-CO'),
        parseFlexDate(c.lastAppointmentDate).toLocaleDateString('es-CO'),
        c.isVIP ? 'VIP' : c.isRecurrent ? 'Recurrente' : 'Nuevo',
      ]);
      const csv = [headers, ...rows].map((r) => r.map(String).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clientes.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = [
        'Fecha',
        'Hora',
        'Cliente',
        'Correo',
        'Teléfono',
        'Servicio',
        'Dirección',
        'Ciudad',
        'Referencia',
        'Estado',
        'Estado Pago',
        'Monto',
        'Notas',
      ];
      const rows = filteredAppointments.map((apt) => {
        const service = services.find((s) => s.id === apt.serviceId);
        const aptDate = parseFlexDate(apt.startDatetime);
        return [
          aptDate.toLocaleDateString('es-CO'),
          aptDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          apt.customerName,
          apt.customerEmail,
          apt.customerPhone,
          service?.name || '',
          apt.serviceAddress || '',
          apt.serviceCity || '',
          apt.serviceReference || '',
          STATUS_LABELS[apt.status] || apt.status,
          PAYMENT_LABELS[apt.paymentStatus] || apt.paymentStatus,
          service?.priceAmount || 0,
          apt.notes || '',
        ];
      });
      const csv = [headers, ...rows].map((r) => r.map(String).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `citas.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const openEdit = (e: React.MouseEvent, client: FrequentClient) => {
    e.stopPropagation();
    setEditingClient(client);
    setEditForm({
      customerName: client.customerName,
      customerEmail: client.customerEmail,
      customerPhone: client.customerPhone,
    });
    setSaveError(null);
    setTimeout(() => editNameRef.current?.focus(), 50);
  };

  const closeEdit = () => {
    setEditingClient(null);
    setSaveError(null);
  };

  const saveEdit = async () => {
    if (!editingClient) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const clientAppointments = appointments.filter(
        (apt) =>
          (apt.customerEmail && apt.customerEmail === editingClient.customerEmail) ||
          (!apt.customerEmail && apt.customerName === editingClient.customerName)
      );
      await Promise.all(
        clientAppointments.map((apt) =>
          updateClientMutation({
            variables: {
              id: apt.id,
              data: {
                customerName: editForm.customerName,
                customerEmail: editForm.customerEmail,
                customerPhone: editForm.customerPhone,
              },
            },
          })
        )
      );
      await refetchAppointments();
      closeEdit();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = loadingClients || loadingAppointments;

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

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? null : sortDir === 'desc' ? (
      <ChevronDown className="h-3.5 w-3.5 inline ml-1" />
    ) : (
      <ChevronUp className="h-3.5 w-3.5 inline ml-1" />
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {viewMode === 'clients' ? 'Clientes Frecuentes' : 'Todas las Citas'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {viewMode === 'clients'
              ? 'Historial, pagos y ranking de clientes'
              : 'Listado completo de citas programadas'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('clients')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'clients'
                  ? 'bg-fourth-base text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Users className="h-4 w-4 inline mr-1" />
              Clientes
            </button>
            <button
              onClick={() => setViewMode('appointments')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'appointments'
                  ? 'bg-fourth-base text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-1" />
              Citas
            </button>
          </div>
          {viewMode === 'clients' && (
            <button
              onClick={() => setIsNewClientOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              <UserPlus className="h-4 w-4" />
              Nuevo Cliente
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-4 items-center">
        <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />

        {/* Date range selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Período:</label>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setDateRange('week')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                dateRange === 'week'
                  ? 'bg-fourth-base text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                dateRange === 'month'
                  ? 'bg-fourth-base text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                dateRange === 'all'
                  ? 'bg-fourth-base text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
          </div>
        </div>

        {/* Type filter - only for clients view */}
        {viewMode === 'clients' && (
          <div className="flex gap-2 ml-auto">
            {(['all', 'recurring', 'vip'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterType === t
                    ? 'bg-fourth-base text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'recurring' ? '⭐ Recurrentes' : '👑 VIP'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary - only for clients view */}
      {viewMode === 'clients' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Clientes',
              value: effectiveClients.length,
              icon: Users,
              color: 'blue',
            },
            {
              label: 'Recurrentes',
              value: effectiveClients.filter((c) => c.isRecurrent).length,
              icon: Star,
              color: 'yellow',
            },
            {
              label: 'VIP (Top 10%)',
              value: effectiveClients.filter((c) => c.isVIP).length,
              icon: Crown,
              color: 'purple',
            },
            {
              label: 'Total Ingresos',
              value: formatCOP(effectiveClients.reduce((s, c) => s + c.totalRevenue, 0)),
              icon: DollarSign,
              color: 'green',
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
      )}

      {/* Summary for appointments view */}
      {viewMode === 'appointments' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Citas',
              value: filteredAppointments.length,
              icon: Calendar,
              color: 'blue',
            },
            {
              label: 'Confirmadas',
              value: filteredAppointments.filter((a) => a.status === 'CONFIRMED').length,
              icon: Star,
              color: 'blue',
            },
            {
              label: 'Completadas',
              value: filteredAppointments.filter((a) => a.status === 'COMPLETED').length,
              icon: Star,
              color: 'green',
            },
            {
              label: 'Total Ingresos',
              value: formatCOP(
                filteredAppointments.reduce((sum, apt) => {
                  const service = services.find((s) => s.id === apt.serviceId);
                  return sum + (service?.priceAmount || 0);
                }, 0)
              ),
              icon: DollarSign,
              color: 'green',
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
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fourth-base" />
        </div>
      ) : viewMode === 'clients' ? (
        // Clients Table
        filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            {appointmentsError && (
              <div className="flex items-center justify-center gap-2 text-red-500 mb-3">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">Error al cargar citas: {appointmentsError.message}</span>
              </div>
            )}
            <p className="text-gray-500 dark:text-gray-400">
              No se encontraron clientes con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                      onClick={() => toggleSort('totalAppointments')}
                    >
                      Citas <SortIcon k="totalAppointments" />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                      onClick={() => toggleSort('totalRevenue')}
                    >
                      Ingresos <SortIcon k="totalRevenue" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Estado de Pagos
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                      onClick={() => toggleSort('lastAppointmentDate')}
                    >
                      Última visita <SortIcon k="lastAppointmentDate" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.map((client, idx) => {
                    const paidAmount = client.appointmentHistory
                      .filter((apt) => apt.paymentStatus === 'PAID')
                      .reduce((sum, apt) => sum + apt.amount, 0);
                    const pendingAmount = client.totalRevenue - paidAmount;

                    return (
                      <>
                        <tr
                          key={client.customerEmail}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
                          onClick={() =>
                            setExpandedEmail(
                              expandedEmail === client.customerEmail ? null : client.customerEmail
                            )
                          }
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              #{idx + 1} {client.customerName}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {client.customerEmail}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {client.customerPhone}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              {client.totalAppointments}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-fourth-base">
                            {formatCOP(client.totalRevenue)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-green-600 dark:text-green-400">
                              ✓ {formatCOP(paidAmount)}
                            </div>
                            <div className="text-xs text-yellow-600 dark:text-yellow-400">
                              ⏳ {formatCOP(pendingAmount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {parseFlexDate(client.lastAppointmentDate).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4">
                            {client.isVIP ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                <Crown className="h-3 w-3" /> VIP
                              </span>
                            ) : client.isRecurrent ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                <Star className="h-3 w-3" /> Recurrente
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Nuevo
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={(e) => openEdit(e, client)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-fourth-base hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Editar cliente"
                                data-testid="edit-client-btn"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <span className="text-gray-400">
                                {expandedEmail === client.customerEmail ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded appointment history */}
                        {expandedEmail === client.customerEmail && (
                          <tr key={client.customerEmail + '-detail'}>
                            <td colSpan={7} className="px-6 pb-4 bg-gray-50 dark:bg-gray-900/30">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mt-3 mb-2">
                                Historial de Citas
                              </p>
                              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                  <thead className="bg-white dark:bg-gray-800">
                                    <tr>
                                      {['Fecha', 'Servicio', 'Estado', 'Pago', 'Monto'].map((h) => (
                                        <th
                                          key={h}
                                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                                        >
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {client.appointmentHistory
                                      .slice()
                                      .sort(
                                        (a, b) =>
                                          new Date(b.date).getTime() - new Date(a.date).getTime()
                                      )
                                      .map((apt) => (
                                        <tr
                                          key={apt.id}
                                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                        >
                                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                            {parseFlexDate(apt.date).toLocaleDateString('es-CO', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                            })}
                                          </td>
                                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                            {apt.serviceName || '—'}
                                          </td>
                                          <td className="px-4 py-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                              {STATUS_LABELS[apt.status] || apt.status}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2">
                                            <span
                                              className={`text-xs px-2 py-0.5 rounded-full ${
                                                apt.paymentStatus === 'PAID'
                                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                              }`}
                                            >
                                              {PAYMENT_LABELS[apt.paymentStatus] ||
                                                apt.paymentStatus}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">
                                            {formatCOP(apt.amount)}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : // Appointments Table
      filteredAppointments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
          No se encontraron citas en el rango de fechas seleccionado.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Pago / Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAppointments.map((apt) => {
                  const service = services.find((s) => s.id === apt.serviceId);
                  const aptDate = parseFlexDate(apt.startDatetime);
                  const location = [apt.serviceAddress, apt.serviceCity].filter(Boolean).join(', ');

                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {aptDate.toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {aptDate.toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {apt.customerName}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {apt.customerEmail}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" /> {apt.customerPhone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {service?.name || 'Sin servicio'}
                        </div>
                        {apt.notes && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs truncate">
                            {apt.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {location ? (
                          <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                            {location}
                            {apt.serviceReference && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {apt.serviceReference}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {STATUS_LABELS[apt.status] || apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {editingPayment?.aptId === apt.id ? (
                          <div
                            className="flex flex-col gap-2 min-w-[160px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              value={editingPayment.status}
                              onChange={(e) =>
                                setEditingPayment((prev) =>
                                  prev ? { ...prev, status: e.target.value } : prev
                                )
                              }
                              className="w-full text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fourth-base"
                            >
                              {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v}
                                </option>
                              ))}
                            </select>
                            <select
                              value={editingPayment.method}
                              onChange={(e) =>
                                setEditingPayment((prev) =>
                                  prev ? { ...prev, method: e.target.value } : prev
                                )
                              }
                              className="w-full text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fourth-base"
                            >
                              <option value="">Sin método</option>
                              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-1">
                              <button
                                onClick={handleSavePayment}
                                disabled={paymentSaving}
                                className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-fourth-base text-white rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                              >
                                {paymentSaving ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Save className="h-3 w-3" />
                                )}
                                {paymentSaving ? 'Guardando' : 'Guardar'}
                              </button>
                              <button
                                onClick={() => setEditingPayment(null)}
                                className="px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => openPaymentEditor(e, apt)}
                            className="group flex flex-col gap-0.5 text-left"
                            title="Click para editar pago"
                          >
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-opacity group-hover:opacity-80 ${
                                apt.paymentStatus === 'PAID'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : apt.paymentStatus === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                    : apt.paymentStatus === 'PARTIAL'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {PAYMENT_LABELS[apt.paymentStatus] || apt.paymentStatus}
                              <ChevronDownIcon className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                            </span>
                            {apt.paymentMethod && (
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 pl-0.5">
                                <CreditCard className="h-3 w-3" />
                                {PAYMENT_METHOD_LABELS[apt.paymentMethod] || apt.paymentMethod}
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-fourth-base">
                          {service ? formatCOP(service.priceAmount) : '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Editar Cliente
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Los cambios se aplican a todas las citas de este cliente
                </p>
              </div>
              <button
                onClick={closeEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre completo
                </label>
                <input
                  ref={editNameRef}
                  type="text"
                  value={editForm.customerName}
                  onChange={(e) => setEditForm((f) => ({ ...f, customerName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={editForm.customerEmail}
                    onChange={(e) => setEditForm((f) => ({ ...f, customerEmail: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm((f) => ({ ...f, customerPhone: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                    placeholder="+57 300 000 0000"
                  />
                </div>
              </div>

              {saveError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {saveError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeEdit}
                disabled={isSaving}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={isSaving || !editForm.customerName.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-fourth-base rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="save-client-btn"
              >
                {isSaving ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Client Modal ─────────────────────────────────────────── */}
      {isNewClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-green-500" />
                Nuevo Cliente
              </h2>
              <button
                onClick={() => {
                  setIsNewClientOpen(false);
                  setNewClientError(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={newClientForm.customerName}
                  onChange={handleNewClientChange}
                  placeholder="Nombre completo"
                  data-testid="new-client-name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="customerEmail"
                    value={newClientForm.customerEmail}
                    onChange={handleNewClientChange}
                    placeholder="cliente@email.com"
                    data-testid="new-client-email"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Phone + WhatsApp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      name="customerPhone"
                      value={newClientForm.customerPhone}
                      onChange={handleNewClientChange}
                      placeholder="3001234567"
                      data-testid="new-client-phone"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp
                  </label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      name="customerWhatsapp"
                      value={newClientForm.customerWhatsapp}
                      onChange={handleNewClientChange}
                      placeholder="3001234567"
                      data-testid="new-client-whatsapp"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Service */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Servicio <span className="text-red-500">*</span>
                </label>
                <select
                  name="serviceId"
                  value={newClientForm.serviceId}
                  onChange={handleNewClientChange}
                  data-testid="new-client-service"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecciona un servicio</option>
                  {(servicesData?.servicesByProvider ?? []).map((s: Service) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatCOP(s.priceAmount)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={newClientForm.appointmentDate}
                    onChange={handleNewClientChange}
                    data-testid="new-client-date"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    name="appointmentTime"
                    value={newClientForm.appointmentTime}
                    onChange={handleNewClientChange}
                    data-testid="new-client-time"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas
                </label>
                <textarea
                  name="notes"
                  value={newClientForm.notes}
                  onChange={handleNewClientChange}
                  placeholder="Observaciones sobre el cliente o la cita..."
                  rows={3}
                  data-testid="new-client-notes"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {newClientError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {newClientError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsNewClientOpen(false);
                  setNewClientError(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateClient}
                disabled={newClientSaving}
                data-testid="new-client-submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {newClientSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {newClientSaving ? 'Guardando...' : 'Agregar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
