'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useSessionStore } from '@/lib/store/dashboard';
import {
  X,
  Clock,
  Calendar as CalendarIcon,
  User,
  Phone,
  Plus,
  Trash2,
  Check,
  MapPin,
  Mail,
  Search,
  ChevronDown as ChevronDownIcon,
} from 'lucide-react';
import esLocale from '@fullcalendar/core/locales/es';

interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end?: string;
  extendedProps: {
    appointmentId?: string;
    serviceId?: string;
    serviceName: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    price: number;
    status: string;
    paymentStatus?: string;
    serviceAddress?: string;
    serviceCity?: string;
    serviceReference?: string;
    notes?: string;
  };
}

interface KnownClient {
  name: string;
  email: string;
  phone: string;
  appointmentCount: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente confirmación',
  CONFIRMED: 'Confirmada',
  CANCELLED_BY_CLIENT: 'Cancelada por cliente',
  CANCELLED_BY_PROVIDER: 'Cancelada por proveedor',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PARTIAL: 'Parcial',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

// GraphQL Queries
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
      serviceAddress
      serviceCity
      serviceReference
      reminderSent
      createdAt
    }
  }
`;

const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment($data: CreateAppointmentInput!) {
    createAppointment(data: $data) {
      id
      serviceProviderId
      serviceId
      customerName
      customerEmail
      customerPhone
      customerWhatsappNumber
      startDatetime
      endDatetime
      status
      paymentStatus
      serviceAddress
      serviceCity
      serviceReference
      notes
      createdAt
    }
  }
`;

const UPDATE_APPOINTMENT = gql`
  mutation UpdateAppointment($id: String!, $data: UpdateAppointmentInput!) {
    updateAppointment(id: $id, data: $data) {
      id
      serviceProviderId
      serviceId
      customerName
      customerEmail
      customerPhone
      customerWhatsappNumber
      startDatetime
      endDatetime
      status
      paymentStatus
      notes
      serviceAddress
      serviceCity
      serviceReference
      createdAt
      updatedAt
    }
  }
`;

const DELETE_APPOINTMENT = gql`
  mutation DeleteAppointment($id: String!) {
    deleteAppointment(id: $id) {
      id
    }
  }
`;

export default function ServiceCalendar() {
  const { user } = useSessionStore();
  const serviceProviderId = user?.serviceProviderId;
  const calendarRef = useRef<FullCalendar>(null);

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Appointment Form
  const [appointmentForm, setAppointmentForm] = useState({
    serviceId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    startDatetime: '',
    endDatetime: '',
    notes: '',
    serviceAddress: '',
    serviceCity: '',
    serviceReference: '',
    status: 'PENDING',
    paymentStatus: 'PENDING',
  });

  // Service Form

  // Client autocomplete
  const [clientQuery, setClientQuery] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const clientComboRef = useRef<HTMLDivElement>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const [activeClientIndex, setActiveClientIndex] = useState(-1);

  // GraphQL
  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  const { data: appointmentsData, refetch: refetchAppointments } = useQuery(GET_APPOINTMENTS, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  // Build deduplicated client list from past appointments
  const knownClients = useMemo((): KnownClient[] => {
    const raw = appointmentsData?.appointmentsByProvider ?? [];
    const map = new Map<string, KnownClient>();
    for (const apt of raw) {
      const key = apt.customerEmail?.toLowerCase() || apt.customerName?.toLowerCase() || '';
      if (!key) continue;
      if (map.has(key)) {
        map.get(key)!.appointmentCount++;
      } else {
        map.set(key, {
          name: apt.customerName || '',
          email: apt.customerEmail || '',
          phone: apt.customerPhone || '',
          appointmentCount: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.appointmentCount - a.appointmentCount);
  }, [appointmentsData]);

  const clientSuggestions = useMemo(() => {
    if (!clientQuery.trim()) return knownClients.slice(0, 8);
    const q = clientQuery.toLowerCase();
    return knownClients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
      )
      .slice(0, 8);
  }, [knownClients, clientQuery]);

  const [createAppointment] = useMutation(CREATE_APPOINTMENT);
  const [updateAppointment] = useMutation(UPDATE_APPOINTMENT);
  const [deleteAppointment] = useMutation(DELETE_APPOINTMENT);

  // Close client suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientComboRef.current && !clientComboRef.current.contains(e.target as Node)) {
        setShowClientSuggestions(false);
        setActiveClientIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectClient = (client: KnownClient) => {
    setAppointmentForm((f) => ({
      ...f,
      customerName: client.name,
      customerEmail: client.email,
      customerPhone: client.phone,
    }));
    setClientQuery(client.name);
    setShowClientSuggestions(false);
    setActiveClientIndex(-1);
  };

  const handleClientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showClientSuggestions || clientSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveClientIndex((i) => Math.min(i + 1, clientSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveClientIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeClientIndex >= 0) {
      e.preventDefault();
      selectClient(clientSuggestions[activeClientIndex]);
    } else if (e.key === 'Escape') {
      setShowClientSuggestions(false);
      setActiveClientIndex(-1);
    }
  };

  // Load appointments into calendar events
  useEffect(() => {
    if (appointmentsData?.appointmentsByProvider) {
      const calendarEvents: CalendarEvent[] = appointmentsData.appointmentsByProvider.map(
        (apt: any) => {
          // Find service name from services list
          const service = servicesData?.servicesByProvider?.find(
            (s: any) => s.id === apt.serviceId
          );

          // Parse start/end values which may be epoch ms (string) or ISO string
          const startDate = Number(apt.startDatetime);
          const endDate = Number(apt.endDatetime);
          const parsedStart = Number.isFinite(startDate)
            ? new Date(startDate)
            : new Date(apt.startDatetime);
          const parsedEnd = Number.isFinite(endDate)
            ? new Date(endDate)
            : new Date(apt.endDatetime);

          // Calendar preview: show only service – customer name – time (no price)
          const event = {
            id: apt.id,
            title: `${service?.name || 'Servicio'} – ${apt.customerName}`,
            // Pass ISO strings so FullCalendar correctly applies `timeZone` (America/Bogota)
            start: parsedStart.toISOString(),
            end: parsedEnd.toISOString(),
            backgroundColor: getStatusColor(apt.status),
            borderColor: getStatusColor(apt.status),
            extendedProps: {
              appointmentId: apt.id,
              serviceId: apt.serviceId,
              serviceName: service?.name || 'Servicio',
              customerName: apt.customerName,
              customerEmail: apt.customerEmail,
              customerPhone: apt.customerPhone,
              price: service?.priceAmount || 0,
              status: apt.status,
              paymentStatus: apt.paymentStatus,
              serviceAddress: apt.serviceAddress || '',
              serviceCity: apt.serviceCity || '',
              serviceReference: apt.serviceReference || '',
              notes: apt.notes || '',
              reminderSent: apt.reminderSent,
            },
          };

          return event;
        }
      );

      setEvents(calendarEvents);
    }
  }, [appointmentsData, servicesData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#10b981'; // green
      case 'PENDING':
        return '#f59e0b'; // orange
      case 'CANCELLED':
      case 'CANCELLED_BY_CLIENT':
      case 'CANCELLED_BY_PROVIDER':
        return '#ef4444'; // red
      case 'COMPLETED':
        return '#6366f1'; // indigo
      default:
        return 'var(--fourth-base)';
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent(null);
    resetAppointmentForm();
    setAppointmentForm((prev) => ({
      ...prev,
      startDatetime: selectInfo.startStr,
      endDatetime: selectInfo.endStr || selectInfo.startStr,
    }));
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setAppointmentForm({
      serviceId: event.extendedProps.serviceId || '',
      customerName: event.extendedProps.customerName || '',
      // autocomplete sync
      customerPhone: event.extendedProps.customerPhone || '',
      customerEmail: event.extendedProps.customerEmail || '',
      startDatetime: event.start?.toISOString() || '',
      endDatetime: event.end?.toISOString() || '',
      notes: event.extendedProps.notes || '',
      serviceAddress: event.extendedProps.serviceAddress || '',
      serviceCity: event.extendedProps.serviceCity || '',
      serviceReference: event.extendedProps.serviceReference || '',
      status: event.extendedProps.status || 'PENDING',
      paymentStatus: event.extendedProps.paymentStatus || 'PENDING',
    });
    setIsModalOpen(true);
  };

  const handleCreateAppointment = async () => {
    try {
      const service = servicesData?.servicesByProvider?.find(
        (s: any) => s.id === appointmentForm.serviceId
      );
      if (!service) return;

      const startDate = new Date(appointmentForm.startDatetime);
      const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);

      // Build data object with only non-empty fields
      const data: any = {
        serviceProviderId,
        serviceId: appointmentForm.serviceId,
        customerName: appointmentForm.customerName,
        customerPhone: appointmentForm.customerPhone,
        customerEmail: appointmentForm.customerEmail,
        startDatetime: startDate.toISOString(),
        endDatetime: endDate.toISOString(),
      };

      // Add optional fields only if they have values
      if (appointmentForm.notes?.trim()) {
        data.notes = appointmentForm.notes.trim();
      }
      if (appointmentForm.serviceAddress?.trim()) {
        data.serviceAddress = appointmentForm.serviceAddress.trim();
      }
      if (appointmentForm.serviceCity?.trim()) {
        data.serviceCity = appointmentForm.serviceCity.trim();
      }
      if (appointmentForm.serviceReference?.trim()) {
        data.serviceReference = appointmentForm.serviceReference.trim();
      }

      await createAppointment({
        variables: { data },
      });
      await refetchAppointments();
      setIsModalOpen(false);
      resetAppointmentForm();
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!selectedEvent?.extendedProps.appointmentId) return;
    try {
      // Convert datetime-local to ISO-8601 format
      const startDate = new Date(appointmentForm.startDatetime);
      const endDate = new Date(appointmentForm.endDatetime);

      // Build data object with only non-empty fields
      const data: any = {
        serviceId: appointmentForm.serviceId,
        customerName: appointmentForm.customerName,
        customerEmail: appointmentForm.customerEmail,
        customerPhone: appointmentForm.customerPhone,
        startDatetime: startDate.toISOString(),
        endDatetime: endDate.toISOString(),
        status: appointmentForm.status,
        paymentStatus: appointmentForm.paymentStatus,
      };

      // Add optional fields only if they have values
      if (appointmentForm.notes?.trim()) {
        data.notes = appointmentForm.notes.trim();
      }
      if (appointmentForm.serviceAddress?.trim()) {
        data.serviceAddress = appointmentForm.serviceAddress.trim();
      }
      if (appointmentForm.serviceCity?.trim()) {
        data.serviceCity = appointmentForm.serviceCity.trim();
      }
      if (appointmentForm.serviceReference?.trim()) {
        data.serviceReference = appointmentForm.serviceReference.trim();
      }

      await updateAppointment({
        variables: {
          id: selectedEvent.extendedProps.appointmentId,
          data,
        },
      });
      await refetchAppointments();
      setIsModalOpen(false);
      resetAppointmentForm();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedEvent?.extendedProps.appointmentId) return;
    try {
      await deleteAppointment({
        variables: { id: selectedEvent.extendedProps.appointmentId },
      });
      await refetchAppointments();
      setIsModalOpen(false);
      resetAppointmentForm();
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const resetAppointmentForm = () => {
    setClientQuery('');
    setShowClientSuggestions(false);
    setAppointmentForm({
      serviceId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      startDatetime: '',
      endDatetime: '',
      notes: '',
      serviceAddress: '',
      serviceCity: '',
      serviceReference: '',
      status: 'PENDING',
      paymentStatus: 'PENDING',
    });
    setSelectedEvent(null);
  };

  if (!serviceProviderId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">
          No se encontró el ID del proveedor de servicios
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Calendario de Servicios
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tus citas y disponibilidad
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => {
              setSelectedEvent(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-fourth-base text-white rounded-lg hover:opacity-90 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Próximas Citas
            </h3>
            <div className="space-y-3">
              {appointmentsData?.appointmentsByProvider
                ?.filter((apt: any) => {
                  const s = Number(apt.startDatetime);
                  const startDate = Number.isFinite(s) ? new Date(s) : new Date(apt.startDatetime);
                  return startDate >= new Date();
                })
                .sort((a: any, b: any) => {
                  const sA = Number(a.startDatetime);
                  const sB = Number(b.startDatetime);
                  const dateA = Number.isFinite(sA) ? new Date(sA) : new Date(a.startDatetime);
                  const dateB = Number.isFinite(sB) ? new Date(sB) : new Date(b.startDatetime);
                  return dateA.getTime() - dateB.getTime();
                })
                .slice(0, 5)
                .map((apt: any) => {
                  // Find service name from services list
                  const service = servicesData?.servicesByProvider?.find(
                    (s: any) => s.id === apt.serviceId
                  );

                  return (
                    <div
                      key={apt.id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {apt.customerName}
                        </h4>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: getStatusColor(apt.status) + '20',
                              color: getStatusColor(apt.status),
                            }}
                          >
                            {STATUS_LABELS[apt.status] || apt.status}
                          </span>
                          {apt.reminderSent && (
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                              🔔 Recordatorio enviado
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {service?.name || 'Servicio'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {(() => {
                          const s = Number(apt.startDatetime);
                          const d = Number.isFinite(s) ? new Date(s) : new Date(apt.startDatetime);
                          return d.toLocaleString('es-CO', {
                            timeZone: 'America/Bogota',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                        })()}
                      </p>
                    </div>
                  );
                }) || (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No hay citas próximas
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale={esLocale}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={events}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              height="auto"
              contentHeight="auto"
              aspectRatio={1.5}
            />
          </div>
        </div>
      </div>

      {/* Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {selectedEvent ? 'Editar Cita' : 'Nueva Cita'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-fourth-base dark:hover:text-gray-300 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {/* Service Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                  Servicio
                </label>
                <select
                  value={appointmentForm.serviceId}
                  onChange={(e) =>
                    setAppointmentForm({ ...appointmentForm, serviceId: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                >
                  <option value="">Selecciona un servicio</option>
                  {servicesData?.servicesByProvider
                    ?.filter((s: any) => s.isActive)
                    .map((service: any) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.durationMinutes} min - $
                        {service.priceAmount.toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              {/* ── Client Autocomplete ── */}
              {!selectedEvent ? (
                /* NEW APPOINTMENT — searchable client picker */
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                    Cliente
                    {knownClients.length > 0 && (
                      <span className="ml-2 text-[10px] font-normal text-fourth-base bg-fourth-base/10 px-1.5 py-0.5 rounded-full">
                        {knownClients.length} registrados
                      </span>
                    )}
                  </label>

                  {/* Combobox wrapper */}
                  <div ref={clientComboRef} className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        ref={clientInputRef}
                        type="text"
                        value={clientQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setClientQuery(val);
                          setAppointmentForm({ ...appointmentForm, customerName: val });
                          setShowClientSuggestions(true);
                          setActiveClientIndex(-1);
                        }}
                        onFocus={() => setShowClientSuggestions(true)}
                        onKeyDown={handleClientKeyDown}
                        className="w-full pl-9 pr-9 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                        placeholder={
                          knownClients.length > 0
                            ? 'Buscar o escribir nombre…'
                            : 'Nombre del cliente'
                        }
                        autoComplete="off"
                        data-testid="client-search-input"
                      />
                      {clientQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setClientQuery('');
                            setAppointmentForm({
                              ...appointmentForm,
                              customerName: '',
                              customerEmail: '',
                              customerPhone: '',
                            });
                            setShowClientSuggestions(false);
                            clientInputRef.current?.focus();
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <ChevronDownIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Dropdown */}
                    {showClientSuggestions && (
                      <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
                        {clientSuggestions.length > 0 ? (
                          <ul className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                            {clientSuggestions.map((client, idx) => {
                              const initials = client.name
                                .split(' ')
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase();
                              const isActive = idx === activeClientIndex;
                              return (
                                <li
                                  key={client.email || client.name}
                                  onMouseDown={() => selectClient(client)}
                                  onMouseEnter={() => setActiveClientIndex(idx)}
                                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                                    isActive
                                      ? 'bg-fourth-base/10 dark:bg-fourth-base/20'
                                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  {/* Avatar */}
                                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-fourth-base/15 flex items-center justify-center text-fourth-base font-semibold text-xs">
                                    {initials || '?'}
                                  </div>
                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {client.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {client.email && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-0.5">
                                          <Mail className="h-3 w-3 flex-shrink-0" />
                                          {client.email}
                                        </span>
                                      )}
                                      {client.phone && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 flex items-center gap-0.5">
                                          <Phone className="h-3 w-3" />
                                          {client.phone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {/* Appointment count badge */}
                                  <span className="flex-shrink-0 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                    {client.appointmentCount} cita
                                    {client.appointmentCount !== 1 ? 's' : ''}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Nuevo cliente — completa los datos abajo
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Auto-filled email & phone — shown after client selected or typed */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        <Mail className="h-3 w-3 inline mr-1" />
                        Correo
                      </label>
                      <input
                        type="email"
                        value={appointmentForm.customerEmail}
                        onChange={(e) =>
                          setAppointmentForm({ ...appointmentForm, customerEmail: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        <Phone className="h-3 w-3 inline mr-1" />
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={appointmentForm.customerPhone}
                        onChange={(e) =>
                          setAppointmentForm({ ...appointmentForm, customerPhone: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                        placeholder="+57 300 123 4567"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* EDIT APPOINTMENT — plain fields */
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                      Nombre del Cliente
                    </label>
                    <input
                      type="text"
                      value={appointmentForm.customerName}
                      onChange={(e) =>
                        setAppointmentForm({ ...appointmentForm, customerName: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={appointmentForm.customerEmail}
                      onChange={(e) =>
                        setAppointmentForm({ ...appointmentForm, customerEmail: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                      placeholder="juan.perez@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={appointmentForm.customerPhone}
                      onChange={(e) =>
                        setAppointmentForm({ ...appointmentForm, customerPhone: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                </>
              )}

              {/* Start Date/Time */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                  Fecha y Hora de Inicio
                </label>
                <input
                  type="datetime-local"
                  value={appointmentForm.startDatetime.slice(0, 16)}
                  onChange={(e) =>
                    setAppointmentForm({ ...appointmentForm, startDatetime: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                />
              </div>

              {/* End Date/Time */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                  Fecha y Hora de Fin
                </label>
                <input
                  type="datetime-local"
                  value={appointmentForm.endDatetime.slice(0, 16)}
                  onChange={(e) =>
                    setAppointmentForm({ ...appointmentForm, endDatetime: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                />
              </div>

              {/* Address */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Dirección del servicio (si es presencial)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={appointmentForm.serviceAddress}
                      onChange={(e) =>
                        setAppointmentForm({ ...appointmentForm, serviceAddress: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                      placeholder="Calle 72 #10-15"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={appointmentForm.serviceCity}
                      onChange={(e) =>
                        setAppointmentForm({ ...appointmentForm, serviceCity: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                      placeholder="Bogotá"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Referencia / Punto de encuentro
                  </label>
                  <input
                    type="text"
                    value={appointmentForm.serviceReference}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, serviceReference: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                    placeholder="Frente al parque, piso 3 apto 301..."
                  />
                </div>
              </div>

              {/* Status & Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Estado de cita
                  </label>
                  <select
                    value={appointmentForm.status}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, status: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Estado de pago
                  </label>
                  <select
                    value={appointmentForm.paymentStatus}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, paymentStatus: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                  >
                    {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price — visible only in detail view */}
              {selectedEvent && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    Precio del servicio
                  </span>
                  <span className="text-base font-semibold text-[var(--fourth-base)]">
                    ${(selectedEvent.extendedProps.price || 0).toLocaleString('es-CO')}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  value={appointmentForm.notes}
                  onChange={(e) =>
                    setAppointmentForm({ ...appointmentForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                  placeholder="Información adicional sobre la cita..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
              {selectedEvent ? (
                <button
                  onClick={handleDeleteAppointment}
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base w-full sm:w-auto order-2 sm:order-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </button>
              ) : (
                <div className="hidden sm:block"></div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={selectedEvent ? handleUpdateAppointment : handleCreateAppointment}
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-fourth-base text-white rounded-lg hover:opacity-90 transition-colors text-sm sm:text-base w-full sm:w-auto"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {selectedEvent ? 'Actualizar' : 'Crear Cita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {/* CSS for FullCalendar customization */}
      <style jsx global>{`
        .fc {
          font-family: inherit;
        }
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: rgb(229 231 235);
        }
        .dark .fc-theme-standard td,
        .dark .fc-theme-standard th {
          border-color: rgb(55 65 81);
        }
        .fc-button-primary {
          background-color: var(--fourth-base) !important;
          border-color: var(--fourth-base) !important;
        }
        .fc-button-primary:hover {
          opacity: 0.9;
        }
        .fc-button-primary:disabled {
          opacity: 0.5;
        }
        .dark .fc {
          color: rgb(229 231 235);
        }
        .dark .fc-toolbar-title {
          color: white;
        }
        .dark .fc-col-header-cell {
          background-color: rgb(31 41 55);
        }
        .dark .fc-daygrid-day {
          background-color: rgb(17 24 39);
        }
        .dark .fc-scrollgrid {
          border-color: rgb(55 65 81);
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .fc-toolbar {
            flex-direction: column;
            gap: 0.5rem;
          }
          .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
            width: 100%;
          }
          .fc-button {
            padding: 0.4rem 0.6rem;
            font-size: 0.875rem;
          }
          .fc-toolbar-title {
            font-size: 1.1rem;
          }
          .fc-timegrid-slot {
            height: 2.5rem;
          }
          .fc-timegrid-event {
            font-size: 0.75rem;
          }
          .fc-event-title {
            font-size: 0.7rem;
          }
          .fc-col-header-cell-cushion {
            padding: 0.25rem;
            font-size: 0.75rem;
          }
          .fc-daygrid-day-number {
            font-size: 0.875rem;
          }
        }

        /* Tablet optimizations */
        @media (min-width: 641px) and (max-width: 1024px) {
          .fc-toolbar-title {
            font-size: 1.25rem;
          }
          .fc-button {
            padding: 0.5rem 0.75rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
