'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Download,
  Filter,
  Users,
} from 'lucide-react';
import KPICard from '../components/KPICard';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import { useSessionStore } from '@/lib/store/dashboard';
import { SectionLoader } from '@/app/components/Loader';

// ─── GraphQL Queries ────────────────────────────────────────────────────────

const GET_APPOINTMENTS = gql`
  query GetAppointmentsDashboard($serviceProviderId: String!) {
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
  query GetServicesDashboard($serviceProviderId: String!) {
    servicesByProvider(serviceProviderId: $serviceProviderId) {
      id
      name
      priceAmount
    }
  }
`;

const GET_EXPENSES = gql`
  query GetExpensesDashboard($serviceProviderId: String!) {
    expensesByProvider(serviceProviderId: $serviceProviderId) {
      id
      date
      category
      description
      amount
      paymentMethod
      createdAt
    }
  }
`;

const GET_PROVIDER_EARNINGS = gql`
  query ProviderEarnings($serviceProviderId: String!, $startDate: DateTime, $endDate: DateTime) {
    providerEarnings(
      serviceProviderId: $serviceProviderId
      startDate: $startDate
      endDate: $endDate
    ) {
      serviceProviderId
      totalEarnings
      totalExpenses
      netProfit
      currency
      paidAppointmentCount
      startDate
      endDate
      earningsByService {
        serviceId
        serviceName
        appointmentCount
        total
      }
    }
  }
`;

// ─── Interfaces ──────────────────────────────────────────────────────────────

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
  notes: string;
  createdAt: string;
}

interface Service {
  id: string;
  name: string;
  priceAmount: number;
}

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
}

interface EarningsByService {
  serviceId: string;
  serviceName: string;
  appointmentCount: number;
  total: number;
}

interface ProviderEarnings {
  serviceProviderId: string;
  totalEarnings: number;
  totalExpenses: number;
  netProfit: number;
  currency: string;
  paidAppointmentCount: number;
  startDate: string;
  endDate: string;
  earningsByService: EarningsByService[];
}

type TimePeriod = '7D' | '1M' | '3M' | '6M';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseAppointmentDate = (datetime: string): Date => {
  const parsed = parseInt(datetime, 10);
  if (!isNaN(parsed) && parsed > 0) {
    return new Date(parsed);
  }
  return new Date(datetime);
};

const parseExpenseDate = (dateStr: string): Date => {
  const parsed = parseInt(dateStr, 10);
  if (!isNaN(parsed) && parsed > 0) {
    return new Date(parsed);
  }
  return new Date(dateStr);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
  };
  return labels[status] || status;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServiceDashboard() {
  const { user } = useSessionStore();
  const serviceProviderId = user?.serviceProviderId;
  const [mounted, setMounted] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('3M');

  // Date range filter
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: appointmentsData,
    loading: appointmentsLoading,
    error: appointmentsError,
  } = useQuery(GET_APPOINTMENTS, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
    fetchPolicy: 'network-only',
  });

  const {
    data: servicesData,
    loading: servicesLoading,
    error: servicesError,
  } = useQuery(GET_SERVICES, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
    fetchPolicy: 'network-only',
  });

  const {
    data: expensesData,
    loading: expensesLoading,
    error: expensesError,
  } = useQuery(GET_EXPENSES, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
    fetchPolicy: 'network-only',
  });

  const {
    data: earningsData,
    loading: earningsLoading,
    error: earningsError,
  } = useQuery(GET_PROVIDER_EARNINGS, {
    variables: {
      serviceProviderId: serviceProviderId || '',
      startDate: new Date(dateFrom + 'T00:00:00').toISOString(),
      endDate: new Date(dateTo + 'T23:59:59').toISOString(),
    },
    skip: !serviceProviderId,
    fetchPolicy: 'network-only',
  });

  const queryError = appointmentsError || servicesError || expensesError || earningsError;

  const appointments: Appointment[] = useMemo(
    () => appointmentsData?.appointmentsByProvider || [],
    [appointmentsData]
  );

  const services: Service[] = useMemo(() => servicesData?.servicesByProvider || [], [servicesData]);

  const expenses: Expense[] = useMemo(() => expensesData?.expensesByProvider || [], [expensesData]);

  // Filter appointments by date range
  const filteredAppointments = useMemo(() => {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    return appointments.filter((apt) => {
      const d = parseAppointmentDate(apt.startDatetime);
      return d >= from && d <= to;
    });
  }, [appointments, dateFrom, dateTo]);

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    return expenses.filter((exp) => {
      const d = parseExpenseDate(exp.date);
      return d >= from && d <= to;
    });
  }, [expenses, dateFrom, dateTo]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Cliente',
      'Correo',
      'Teléfono',
      'Servicio',
      'Precio',
      'Fecha',
      'Hora',
      'Estado',
      'Estado Pago',
    ];
    const rows = filteredAppointments.map((apt) => {
      const service = services.find((s) => s.id === apt.serviceId);
      const date = parseAppointmentDate(apt.startDatetime);
      return [
        apt.customerName,
        apt.customerEmail,
        apt.customerPhone,
        service?.name || '',
        service?.priceAmount ?? 0,
        date.toLocaleDateString('es-ES'),
        date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        apt.status,
        apt.paymentStatus,
      ];
    });
    const csvContent = [headers, ...rows].map((r) => r.map(String).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-citas-${dateFrom}-${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── KPI Calculations ─────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const earnings: ProviderEarnings | null = earningsData?.providerEarnings ?? null;

    return {
      totalAppointments: filteredAppointments.length,
      paidAppointmentCount: earnings?.paidAppointmentCount ?? 0,
      totalEarnings: earnings?.totalEarnings ?? 0,
      totalExpenses: earnings?.totalExpenses ?? 0,
      balance: earnings?.netProfit ?? 0,
      currency: earnings?.currency ?? 'COP',
      earningsByService: earnings?.earningsByService ?? [],
    };
  }, [earningsData, filteredAppointments]);

  // ─── Sales Over Time Chart ────────────────────────────────────────────────

  const salesChartData = useMemo(() => {
    const now = new Date();

    if (timePeriod === '7D') {
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now);
        day.setDate(day.getDate() - (6 - i));
        day.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        let ganancias = 0;
        filteredAppointments.forEach((apt) => {
          const d = parseAppointmentDate(apt.startDatetime);
          if (
            d >= day &&
            d <= dayEnd &&
            (apt.status === 'CONFIRMED' || apt.status === 'COMPLETED')
          ) {
            const service = services.find((s) => s.id === apt.serviceId);
            if (service) ganancias += service.priceAmount;
          }
        });

        return {
          label: day.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
          ganancias,
        };
      });
    }

    if (timePeriod === '1M') {
      return Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (3 - i) * 7 - 6);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        let ganancias = 0;
        filteredAppointments.forEach((apt) => {
          const d = parseAppointmentDate(apt.startDatetime);
          if (
            d >= weekStart &&
            d <= weekEnd &&
            (apt.status === 'CONFIRMED' || apt.status === 'COMPLETED')
          ) {
            const service = services.find((s) => s.id === apt.serviceId);
            if (service) ganancias += service.priceAmount;
          }
        });

        return {
          label: `Sem ${i + 1}`,
          ganancias,
        };
      });
    }

    const months = timePeriod === '3M' ? 3 : 6;
    return Array.from({ length: months }, (_, i) => {
      const offset = months - 1 - i;
      const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      let ganancias = 0;
      filteredAppointments.forEach((apt) => {
        const d = parseAppointmentDate(apt.startDatetime);
        if (
          d >= monthStart &&
          d <= monthEnd &&
          (apt.status === 'CONFIRMED' || apt.status === 'COMPLETED')
        ) {
          const service = services.find((s) => s.id === apt.serviceId);
          if (service) ganancias += service.priceAmount;
        }
      });

      return {
        label: monthStart.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        ganancias,
      };
    });
  }, [timePeriod, filteredAppointments, services]);

  // ─── Payment Methods Chart ────────────────────────────────────────────────

  const paymentMethodChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      const method = e.paymentMethod || 'OTRO';
      counts[method] = (counts[method] || 0) + e.amount;
    });
    return Object.entries(counts).map(([metodo, total]) => ({ metodo, total }));
  }, [filteredExpenses]);

  // ─── Upcoming Appointments ────────────────────────────────────────────────

  const upcomingAppointmentsList = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((apt) => {
        const aptDate = parseAppointmentDate(apt.startDatetime);
        return (
          aptDate >= now &&
          apt.status !== 'CANCELLED' &&
          apt.status !== 'CANCELLED_BY_CLIENT' &&
          apt.status !== 'CANCELLED_BY_PROVIDER'
        );
      })
      .sort((a, b) => {
        const dateA = parseAppointmentDate(a.startDatetime);
        const dateB = parseAppointmentDate(b.startDatetime);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 10);
  }, [appointments]);

  const isLoading = appointmentsLoading || servicesLoading || expensesLoading || earningsLoading;

  // ─── Guard: no provider ───────────────────────────────────────────────────

  if (!serviceProviderId) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No se encontró el proveedor de servicios
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No tienes un proveedor de servicios asociado a tu cuenta.
          </p>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fourth-base"></div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Query Error Banner ── */}
      {queryError && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Error al cargar datos: {queryError.message}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Panel de Control
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vista general de citas, ganancias y rendimiento del negocio
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 active:scale-95 transition-all text-sm font-medium shadow-sm"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* ── Date Filter Bar ── */}
      <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 sm:px-4 sm:py-3 flex flex-row items-center gap-2 sm:gap-3 shadow-sm flex-wrap">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 shrink-0">
          <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">
            Período
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
            Desde
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex-1 min-w-0 px-2 py-1 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:outline-none transition"
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
            Hasta
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="flex-1 min-w-0 px-2 py-1 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:outline-none transition"
          />
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0 hidden sm:inline">
          {filteredAppointments.length} de {appointments.length} citas
        </span>
      </div>

      {/* ── 4 Hero KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Citas */}
        <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Cantidad Citas
              </p>
              {isLoading ? (
                <div className="mt-2 h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {kpis.totalAppointments.toLocaleString()}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">en el período</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Ganancias */}
        <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Ganancias
              </p>
              {isLoading ? (
                <div className="mt-2 h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                  ${kpis.totalEarnings.toLocaleString()}
                </p>
              )}
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                {kpis.paidAppointmentCount} citas pagadas
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Gastos */}
        <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Gastos
              </p>
              {isLoading ? (
                <div className="mt-2 h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                  ${kpis.totalExpenses.toLocaleString()}
                </p>
              )}
              <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">
                en el período seleccionado
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/30">
              <TrendingDown className="h-5 w-5 text-rose-500" />
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Balance
              </p>
              {isLoading ? (
                <div className="mt-2 h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                <p
                  className={`mt-2 text-3xl font-bold tabular-nums ${
                    kpis.balance >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {kpis.balance >= 0 ? '+' : ''}${kpis.balance.toLocaleString()}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">ganancias − gastos</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30">
              <DollarSign className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Sales Over Time (LineChart) */}
        <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Ventas por Período
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Ganancias de citas confirmadas y completadas
              </p>
            </div>
            {/* Time Period Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
              {(['7D', '1M', '3M', '6M'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                    timePeriod === period
                      ? 'bg-fourth-base text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <LineChart
            data={salesChartData}
            xKey="label"
            yKey="ganancias"
            color="#10b981"
            height={260}
            containerClassName="px-2 pb-4"
          />
        </div>

        {/* Right: Payment Methods (BarChart) */}
        <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Gastos por Método de Pago
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Total de gastos agrupados por método
            </p>
          </div>
          {paymentMethodChartData.length > 0 ? (
            <BarChart
              data={paymentMethodChartData}
              xKey="metodo"
              yKey="total"
              color="#f43f5e"
              height={260}
              containerClassName="px-2 pb-4"
            />
          ) : (
            <div className="flex items-center justify-center h-[260px] text-sm text-gray-400 dark:text-gray-500">
              Sin datos de gastos en el período
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming Appointments Table ── */}
      <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Próximas Citas</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Citas programadas a partir de hoy
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
              {upcomingAppointmentsList.length}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <SectionLoader text="Cargando citas..." />
          ) : upcomingAppointmentsList.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay citas próximas programadas
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contacto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {upcomingAppointmentsList.map((apt) => {
                  const service = services.find((s) => s.id === apt.serviceId);
                  const aptDate = parseAppointmentDate(apt.startDatetime);
                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {apt.customerName}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {service?.name || '—'}
                        </p>
                        {service && (
                          <p className="text-xs text-gray-400">
                            ${service.priceAmount.toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {aptDate.toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {aptDate.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}
                        >
                          {getStatusLabel(apt.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {apt.customerPhone}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">
                          {apt.customerEmail}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
