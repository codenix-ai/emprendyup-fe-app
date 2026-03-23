'use client';

import { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
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
} from 'lucide-react';

const FREQUENT_CLIENTS = gql`
  query FrequentClients(
    $serviceProviderId: String!
    $startDate: DateTime
    $endDate: DateTime
    $limit: Float
  ) {
    frequentClients(
      serviceProviderId: $serviceProviderId
      startDate: $startDate
      endDate: $endDate
      limit: $limit
    ) {
      customerId
      customerName
      customerEmail
      customerPhone
      totalAppointments
      totalRevenue
      lastAppointmentDate
      firstAppointmentDate
      isRecurrent
      isVIP
      appointmentHistory {
        id
        date
        serviceName
        status
        paymentStatus
        amount
      }
    }
  }
`;

const NEW_VS_RECURRENT = gql`
  query NewVsRecurrent($serviceProviderId: String!, $startDate: DateTime!, $endDate: DateTime!) {
    newVsRecurrentClients(
      serviceProviderId: $serviceProviderId
      startDate: $startDate
      endDate: $endDate
    ) {
      newClients
      recurrentClients
      totalClients
      percentageNew
      percentageRecurrent
    }
  }
`;

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
  notes?: string;
  serviceAddress?: string;
  serviceCity?: string;
  serviceReference?: string;
  createdAt: string;
}

interface Service {
  id: string;
  name: string;
  priceAmount: number;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

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
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'vip'>('all');

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

  // Convert dates to DateTime format for GraphQL
  const startDateTime = useMemo(() => {
    const d = new Date(dateFrom);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [dateFrom]);

  const endDateTime = useMemo(() => {
    const d = new Date(dateTo);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, [dateTo]);

  const {
    data: clientsData,
    loading: loadingClients,
    error: clientsError,
  } = useQuery(FREQUENT_CLIENTS, {
    variables: {
      serviceProviderId: serviceProviderId || '',
      startDate: startDateTime,
      endDate: endDateTime,
      limit: null,
    },
    skip: !serviceProviderId,
  });

  const { data: statsData } = useQuery(NEW_VS_RECURRENT, {
    variables: {
      serviceProviderId: serviceProviderId || '',
      startDate: startDateTime,
      endDate: endDateTime,
    },
    skip: !serviceProviderId,
  });

  const { data: appointmentsData } = useQuery(GET_ALL_APPOINTMENTS, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  const clients: FrequentClient[] = useMemo(
    () => clientsData?.frequentClients || [],
    [clientsData]
  );

  const newVsRecurrentStats = useMemo(() => statsData?.newVsRecurrentClients, [statsData]);

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
      const aptDate = new Date(parseInt(apt.startDatetime));
      return aptDate >= from && aptDate <= to;
    });

    const clientMap = new Map<string, FrequentClient>();

    for (const apt of rangeApts) {
      const key = apt.customerEmail || apt.customerName;
      const service = services.find((s) => s.id === apt.serviceId);
      const amount = service?.priceAmount || 0;

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          customerId: apt.customerEmail,
          customerName: apt.customerName,
          customerEmail: apt.customerEmail,
          customerPhone: apt.customerPhone,
          totalAppointments: 0,
          totalRevenue: 0,
          lastAppointmentDate: apt.startDatetime,
          firstAppointmentDate: apt.startDatetime,
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
        date: apt.startDatetime,
        serviceName: service?.name || '',
        status: apt.status,
        paymentStatus: apt.paymentStatus,
        amount,
      });

      const aptTime = parseInt(apt.startDatetime);
      if (aptTime > parseInt(client.lastAppointmentDate))
        client.lastAppointmentDate = apt.startDatetime;
      if (aptTime < parseInt(client.firstAppointmentDate))
        client.firstAppointmentDate = apt.startDatetime;
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
        const aptDate = new Date(parseInt(apt.startDatetime));
        return aptDate >= from && aptDate <= to;
      })
      .sort((a, b) => {
        return parseInt(b.startDatetime) - parseInt(a.startDatetime);
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
          new Date(a.lastAppointmentDate).getTime() - new Date(b.lastAppointmentDate).getTime();
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
        new Date(c.firstAppointmentDate).toLocaleDateString('es-CO'),
        new Date(c.lastAppointmentDate).toLocaleDateString('es-CO'),
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
        const aptDate = new Date(parseInt(apt.startDatetime));
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
              value: newVsRecurrentStats?.totalClients || effectiveClients.length,
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
      {loadingClients ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fourth-base" />
        </div>
      ) : viewMode === 'clients' ? (
        // Clients Table
        filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            {clientsError && (
              <div className="flex items-center justify-center gap-2 text-red-500 mb-3">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">Error al cargar clientes: {clientsError.message}</span>
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
                            {new Date(client.lastAppointmentDate).toLocaleDateString('es-CO', {
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
                          <td className="px-6 py-4 text-gray-400">
                            {expandedEmail === client.customerEmail ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
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
                                            {new Date(apt.date).toLocaleDateString('es-CO', {
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
                    Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAppointments.map((apt) => {
                  const service = services.find((s) => s.id === apt.serviceId);
                  const aptDate = new Date(parseInt(apt.startDatetime));
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
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            apt.paymentStatus === 'PAID'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : apt.paymentStatus === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {PAYMENT_LABELS[apt.paymentStatus] || apt.paymentStatus}
                        </span>
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
    </div>
  );
}
