'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import KPICard from '../components/KPICard';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import { useSessionStore } from '@/lib/store/dashboard';

// GraphQL Queries for appointments
const GET_APPOINTMENTS = gql`
  query GetAppointmentsByProvider($serviceProviderId: String!) {
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
      createdAt
    }
  }
`;

const GET_SERVICES = gql`
  query GetServicesByProvider($serviceProviderId: String!) {
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
  description: string;
  durationMinutes: number;
  priceAmount: number;
  currency: string;
  allowsOnlinePayment: boolean;
  isActive: boolean;
  createdAt: string;
}

// Helper function to parse appointment datetime
// The API returns timestamps that may be either unix milliseconds (string) or ISO string
const parseAppointmentDate = (datetime: string): Date => {
  const parsed = parseInt(datetime, 10);
  if (!isNaN(parsed) && parsed > 0) {
    return new Date(parsed);
  }
  return new Date(datetime);
};

export default function ServiceDashboard() {
  const { user } = useSessionStore();
  const serviceProviderId = user?.serviceProviderId;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: appointmentsData, loading: appointmentsLoading } = useQuery(GET_APPOINTMENTS, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  const { data: servicesData, loading: servicesLoading } = useQuery(GET_SERVICES, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  const appointments: Appointment[] = useMemo(
    () => appointmentsData?.appointmentsByProvider || [],
    [appointmentsData]
  );

  const services: Service[] = useMemo(() => servicesData?.servicesByProvider || [], [servicesData]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalAppointments = appointments.length;
    const confirmedAppointments = appointments.filter((apt) => apt.status === 'CONFIRMED').length;
    const pendingAppointments = appointments.filter((apt) => apt.status === 'PENDING').length;
    const completedAppointments = appointments.filter((apt) => apt.status === 'COMPLETED').length;

    // Calculate earnings from confirmed and completed appointments
    let totalEarnings = 0;
    let monthlyEarnings = 0;

    appointments.forEach((apt) => {
      if (apt.status === 'CONFIRMED' || apt.status === 'COMPLETED') {
        const service = services.find((s) => s.id === apt.serviceId);
        if (service) {
          totalEarnings += service.priceAmount;

          // Check if appointment is in current month
          const aptDate = parseAppointmentDate(apt.startDatetime);
          if (aptDate >= startOfMonth) {
            monthlyEarnings += service.priceAmount;
          }
        }
      }
    });

    // Calculate upcoming appointments (next 7 days)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingAppointments = appointments.filter((apt) => {
      const aptDate = parseAppointmentDate(apt.startDatetime);
      return aptDate >= now && aptDate <= nextWeek && apt.status !== 'CANCELLED';
    }).length;

    return {
      totalAppointments,
      confirmedAppointments,
      pendingAppointments,
      completedAppointments,
      totalEarnings,
      monthlyEarnings,
      upcomingAppointments,
    };
  }, [appointments, services]);

  // Generate chart data for appointments over time (last 6 months)
  const appointmentsChartData = useMemo(() => {
    const now = new Date();
    const chartData = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = monthDate.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

      const monthAppointments = appointments.filter((apt) => {
        const aptDate = parseAppointmentDate(apt.startDatetime);
        return aptDate >= monthDate && aptDate <= monthEnd;
      }).length;

      chartData.push({
        month: monthLabel,
        citas: monthAppointments,
      });
    }

    return chartData;
  }, [appointments]);

  // Generate earnings chart data (last 6 months)
  const earningsChartData = useMemo(() => {
    const now = new Date();
    const chartData = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = monthDate.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

      let monthEarnings = 0;
      appointments.forEach((apt) => {
        const aptDate = parseAppointmentDate(apt.startDatetime);
        if (aptDate >= monthDate && aptDate <= monthEnd) {
          if (apt.status === 'CONFIRMED' || apt.status === 'COMPLETED') {
            const service = services.find((s) => s.id === apt.serviceId);
            if (service) {
              monthEarnings += service.priceAmount;
            }
          }
        }
      });

      chartData.push({
        month: monthLabel,
        ganancias: monthEarnings,
      });
    }

    return chartData;
  }, [appointments, services]);

  // Status distribution chart data
  const statusDistributionData = useMemo(() => {
    const statusCounts: Record<string, number> = {};

    appointments.forEach((apt) => {
      const status = apt.status || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusLabels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
      UNKNOWN: 'Desconocido',
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      estado: statusLabels[status] || status,
      cantidad: count,
    }));
  }, [appointments]);

  // Get upcoming appointments
  const upcomingAppointmentsList = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((apt) => {
        const aptDate = parseAppointmentDate(apt.startDatetime);
        return aptDate >= now && apt.status !== 'CANCELLED';
      })
      .sort((a, b) => {
        const dateA = parseAppointmentDate(a.startDatetime);
        const dateB = parseAppointmentDate(b.startDatetime);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 10);
  }, [appointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
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

  const isLoading = appointmentsLoading || servicesLoading;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Vista general de tus citas, ganancias y rendimiento
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total de Citas"
          value={kpis.totalAppointments}
          icon={Calendar}
          loading={isLoading}
        />
        <KPICard
          title="Citas Confirmadas"
          value={kpis.confirmedAppointments}
          icon={CheckCircle}
          loading={isLoading}
        />
        <KPICard
          title="Citas Pendientes"
          value={kpis.pendingAppointments}
          icon={Clock}
          loading={isLoading}
        />
        <KPICard
          title="Ganancias del Mes"
          value={`$${kpis.monthlyEarnings.toLocaleString()}`}
          icon={DollarSign}
          loading={isLoading}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Citas Completadas"
          value={kpis.completedAppointments}
          icon={TrendingUp}
          loading={isLoading}
        />
        <KPICard
          title="Próximas 7 días"
          value={kpis.upcomingAppointments}
          icon={Calendar}
          loading={isLoading}
        />
        <KPICard
          title="Total Ganancias"
          value={`$${kpis.totalEarnings.toLocaleString()}`}
          icon={DollarSign}
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          data={appointmentsChartData}
          xKey="month"
          yKey="citas"
          title="Citas por Mes"
          color="#22c55e"
        />
        <BarChart
          data={earningsChartData}
          xKey="month"
          yKey="ganancias"
          title="Ganancias por Mes"
          color="#3b82f6"
        />
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={statusDistributionData}
          xKey="estado"
          yKey="cantidad"
          title="Distribución por Estado"
          color="#8b5cf6"
        />

        {/* Services Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mis Servicios
          </h3>
          <div className="space-y-3">
            {services.length > 0 ? (
              services.slice(0, 5).map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {service.durationMinutes} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-fourth-base">
                      ${service.priceAmount.toLocaleString()}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        service.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {service.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No hay servicios creados
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Appointments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Próximas Citas</h3>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {upcomingAppointmentsList.length} citas pendientes
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Cargando citas...</div>
          ) : upcomingAppointmentsList.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No hay citas próximas programadas.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Contacto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {upcomingAppointmentsList.map((apt) => {
                  const service = services.find((s) => s.id === apt.serviceId);
                  const aptDate = parseAppointmentDate(apt.startDatetime);

                  return (
                    <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {apt.customerName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {service?.name || 'Servicio'}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${service?.priceAmount?.toLocaleString() || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          {aptDate.toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-xs">
                          {aptDate.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}
                        >
                          {getStatusLabel(apt.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>{apt.customerPhone}</div>
                        <div className="text-xs truncate max-w-[150px]">{apt.customerEmail}</div>
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
