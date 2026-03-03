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

const GET_APPOINTMENTS = gql`
  query GetAppointmentsByProviderCRM($serviceProviderId: String!) {
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
      createdAt
    }
  }
`;

const GET_SERVICES = gql`
  query GetServicesByProviderCRM($serviceProviderId: String!) {
    servicesByProvider(serviceProviderId: $serviceProviderId) {
      id
      name
      priceAmount
    }
  }
`;

interface Appointment {
  id: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDatetime: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface ClientRow {
  email: string;
  name: string;
  phone: string;
  totalAppointments: number;
  totalBilled: number;
  paidAmount: number;
  pendingAmount: number;
  lastVisit: Date;
  firstVisit: Date;
  appointments: Appointment[];
  isRecurring: boolean;
  isVip: boolean;
}

const parseDate = (v: string) => {
  const ms = parseInt(v, 10);
  return isNaN(ms) || ms <= 0 ? new Date(v) : new Date(ms);
};

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

type SortKey = 'totalAppointments' | 'totalBilled' | 'lastVisit';

export default function ServiceCRM() {
  const { user } = useSessionStore();
  const serviceProviderId = user?.serviceProviderId;

  const { data: appointmentsData, loading: loadingApts } = useQuery(GET_APPOINTMENTS, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });
  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  const [sortKey, setSortKey] = useState<SortKey>('totalAppointments');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'vip'>('all');

  const appointments: Appointment[] = useMemo(
    () => appointmentsData?.appointmentsByProvider || [],
    [appointmentsData]
  );
  const services: any[] = useMemo(() => servicesData?.servicesByProvider || [], [servicesData]);

  // Build client list
  const clients = useMemo<ClientRow[]>(() => {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    const map: Record<string, ClientRow> = {};

    appointments.forEach((apt) => {
      const d = parseDate(apt.startDatetime);
      if (d < from || d > to) return;

      const key = apt.customerEmail.toLowerCase().trim();
      const svc = services.find((s) => s.id === apt.serviceId);
      const price = svc?.priceAmount || 0;
      const paid = apt.paymentStatus === 'PAID' || apt.paymentStatus === 'PARTIAL' ? price : 0;

      if (!map[key]) {
        map[key] = {
          email: apt.customerEmail,
          name: apt.customerName,
          phone: apt.customerPhone,
          totalAppointments: 0,
          totalBilled: 0,
          paidAmount: 0,
          pendingAmount: 0,
          lastVisit: d,
          firstVisit: d,
          appointments: [],
          isRecurring: false,
          isVip: false,
        };
      }

      const row = map[key];
      row.totalAppointments += 1;
      row.totalBilled += price;
      row.paidAmount += paid;
      row.pendingAmount += price - paid;
      if (d > row.lastVisit) row.lastVisit = d;
      if (d < row.firstVisit) row.firstVisit = d;
      row.appointments.push(apt);
    });

    const rows = Object.values(map);

    // Mark recurring (>1 appointment)
    rows.forEach((r) => (r.isRecurring = r.totalAppointments > 1));

    // Mark VIP: top 10% by total billed
    const sorted = [...rows].sort((a, b) => b.totalBilled - a.totalBilled);
    const vipCount = Math.max(1, Math.ceil(sorted.length * 0.1));
    sorted.slice(0, vipCount).forEach((r) => (r.isVip = true));

    return rows;
  }, [appointments, services, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    let list = clients;
    if (filterType === 'recurring') list = list.filter((c) => c.isRecurring);
    if (filterType === 'vip') list = list.filter((c) => c.isVip);
    return list.sort((a, b) => {
      let diff = 0;
      if (sortKey === 'totalAppointments') diff = a.totalAppointments - b.totalAppointments;
      if (sortKey === 'totalBilled') diff = a.totalBilled - b.totalBilled;
      if (sortKey === 'lastVisit') diff = a.lastVisit.getTime() - b.lastVisit.getTime();
      return sortDir === 'desc' ? -diff : diff;
    });
  }, [clients, filterType, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Nombre',
      'Correo',
      'Teléfono',
      'Total Citas',
      'Total Facturado',
      'Pagado',
      'Pendiente',
      'Primera Visita',
      'Última Visita',
      'Tipo',
    ];
    const rows = filtered.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.totalAppointments,
      c.totalBilled,
      c.paidAmount,
      c.pendingAmount,
      c.firstVisit.toLocaleDateString('es-CO'),
      c.lastVisit.toLocaleDateString('es-CO'),
      c.isVip ? 'VIP' : c.isRecurring ? 'Recurrente' : 'Nuevo',
    ]);
    const csv = [headers, ...rows].map((r) => r.map(String).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes Frecuentes</h1>
          <p className="text-gray-600 dark:text-gray-400">Historial, pagos y ranking de clientes</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-4 items-center">
        <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
        {/* Date range */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base"
          />
        </div>
        {/* Type filter */}
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
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clientes', value: clients.length, icon: Users, color: 'blue' },
          {
            label: 'Recurrentes',
            value: clients.filter((c) => c.isRecurring).length,
            icon: Star,
            color: 'yellow',
          },
          {
            label: 'VIP (Top 10%)',
            value: clients.filter((c) => c.isVip).length,
            icon: Crown,
            color: 'purple',
          },
          {
            label: 'Total Facturado',
            value: formatCOP(clients.reduce((s, c) => s + c.totalBilled, 0)),
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

      {/* Table */}
      {loadingApts ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fourth-base" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
          No se encontraron clientes con los filtros aplicados.
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
                    onClick={() => toggleSort('totalBilled')}
                  >
                    Facturado <SortIcon k="totalBilled" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Pagado / Pendiente
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                    onClick={() => toggleSort('lastVisit')}
                  >
                    Última visita <SortIcon k="lastVisit" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((client, idx) => (
                  <>
                    <tr
                      key={client.email}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
                      onClick={() =>
                        setExpandedEmail(expandedEmail === client.email ? null : client.email)
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          #{idx + 1} {client.name}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {client.email}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {client.phone}
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
                        {formatCOP(client.totalBilled)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-green-600 dark:text-green-400">
                          ✓ {formatCOP(client.paidAmount)}
                        </div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">
                          ⏳ {formatCOP(client.pendingAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {client.lastVisit.toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {client.isVip ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                            <Crown className="h-3 w-3" /> VIP
                          </span>
                        ) : client.isRecurring ? (
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
                        {expandedEmail === client.email ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </td>
                    </tr>

                    {/* Expanded appointment history */}
                    {expandedEmail === client.email && (
                      <tr key={client.email + '-detail'}>
                        <td colSpan={7} className="px-6 pb-4 bg-gray-50 dark:bg-gray-900/30">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mt-3 mb-2">
                            Historial de Citas
                          </p>
                          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                              <thead className="bg-white dark:bg-gray-800">
                                <tr>
                                  {['Fecha', 'Servicio', 'Estado', 'Pago'].map((h) => (
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
                                {client.appointments
                                  .slice()
                                  .sort(
                                    (a, b) =>
                                      parseDate(b.startDatetime).getTime() -
                                      parseDate(a.startDatetime).getTime()
                                  )
                                  .map((apt) => {
                                    const svc = services.find((s) => s.id === apt.serviceId);
                                    return (
                                      <tr
                                        key={apt.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                      >
                                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                          {parseDate(apt.startDatetime).toLocaleDateString(
                                            'es-CO',
                                            {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                            }
                                          )}
                                        </td>
                                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                          {svc?.name || '—'}
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
                                            {PAYMENT_LABELS[apt.paymentStatus] || apt.paymentStatus}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
