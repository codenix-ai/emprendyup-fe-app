'use client';

import { useState, useRef, useEffect } from 'react';
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
  DollarSign,
  Calendar as CalendarIcon,
  User,
  Phone,
  Plus,
  Trash2,
  Check,
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
  };
}

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
      createdAt
    }
  }
`;

const CREATE_SERVICE = gql`
  mutation CreateService($data: CreateServiceInput!) {
    createService(data: $data) {
      id
      serviceProviderId
      name
      description
      durationMinutes
      priceAmount
      currency
      allowsOnlinePayment
      isActive
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_SERVICE = gql`
  mutation UpdateService($id: String!, $data: UpdateServiceInput!) {
    updateService(id: $id, data: $data) {
      id
      name
      description
      durationMinutes
      priceAmount
      currency
      allowsOnlinePayment
      isActive
      updatedAt
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
      startDatetime
      endDatetime
      status
      paymentStatus
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
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);
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
  });

  // Service Form
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    durationMinutes: 60,
    priceAmount: 0,
    currency: 'COP',
    allowsOnlinePayment: false,
    isActive: true,
  });

  // GraphQL
  const { data: servicesData, refetch: refetchServices } = useQuery(GET_SERVICES, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  const { data: appointmentsData, refetch: refetchAppointments } = useQuery(GET_APPOINTMENTS, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  const [createService] = useMutation(CREATE_SERVICE);
  const [updateService] = useMutation(UPDATE_SERVICE);
  const [createAppointment] = useMutation(CREATE_APPOINTMENT);
  const [updateAppointment] = useMutation(UPDATE_APPOINTMENT);
  const [deleteAppointment] = useMutation(DELETE_APPOINTMENT);

  // Load appointments into calendar events
  useEffect(() => {
    console.log('🔍 Appointments Data:', appointmentsData);
    console.log('🔍 Services Data:', servicesData);

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

          const event = {
            id: apt.id,
            title: `${service?.name || 'Servicio'} - ${apt.customerName}`,
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
            },
          };

          console.log('📅 Event created:', event);
          return event;
        }
      );

      console.log('✅ Total events to display:', calendarEvents.length);
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
        return '#ef4444'; // red
      case 'COMPLETED':
        return '#6366f1'; // indigo
      default:
        return 'var(--fourth-base)';
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent(null);
    setAppointmentForm({
      ...appointmentForm,
      startDatetime: selectInfo.startStr,
      endDatetime: selectInfo.endStr || selectInfo.startStr,
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setAppointmentForm({
      serviceId: event.extendedProps.serviceId || '',
      customerName: event.extendedProps.customerName || '',
      customerPhone: event.extendedProps.customerPhone || '',
      customerEmail: event.extendedProps.customerEmail || '',
      startDatetime: event.start?.toISOString() || '',
      endDatetime: event.end?.toISOString() || '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleCreateService = async () => {
    try {
      if (selectedService) {
        // Update existing service
        await updateService({
          variables: {
            id: selectedService.id,
            data: {
              name: serviceForm.name,
              description: serviceForm.description,
              durationMinutes: serviceForm.durationMinutes,
              priceAmount: serviceForm.priceAmount,
              currency: serviceForm.currency,
              allowsOnlinePayment: serviceForm.allowsOnlinePayment,
              isActive: serviceForm.isActive,
            },
          },
        });
      } else {
        // Create new service
        await createService({
          variables: {
            data: {
              ...serviceForm,
              serviceProviderId,
            },
          },
        });
      }
      await refetchServices();
      setIsServiceModalOpen(false);
      resetServiceForm();
      setSelectedService(null);
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleCreateAppointment = async () => {
    try {
      const service = servicesData?.servicesByProvider?.find(
        (s: any) => s.id === appointmentForm.serviceId
      );
      if (!service) return;

      const startDate = new Date(appointmentForm.startDatetime);
      const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);

      await createAppointment({
        variables: {
          data: {
            serviceProviderId,
            serviceId: appointmentForm.serviceId,
            customerName: appointmentForm.customerName,
            customerPhone: appointmentForm.customerPhone,
            customerEmail: appointmentForm.customerEmail,
            startDatetime: startDate.toISOString(),
            endDatetime: endDate.toISOString(),
            notes: appointmentForm.notes,
          },
        },
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

      await updateAppointment({
        variables: {
          id: selectedEvent.extendedProps.appointmentId,
          data: {
            serviceId: appointmentForm.serviceId,
            customerName: appointmentForm.customerName,
            customerEmail: appointmentForm.customerEmail,
            customerPhone: appointmentForm.customerPhone,
            startDatetime: startDate.toISOString(),
            endDatetime: endDate.toISOString(),
            notes: appointmentForm.notes,
          },
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
    setAppointmentForm({
      serviceId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      startDatetime: '',
      endDatetime: '',
      notes: '',
    });
    setSelectedEvent(null);
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      durationMinutes: 60,
      priceAmount: 0,
      currency: 'COP',
      allowsOnlinePayment: false,
      isActive: true,
    });
  };

  const handleEditService = (service: any) => {
    setSelectedService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      durationMinutes: service.durationMinutes,
      priceAmount: service.priceAmount,
      currency: service.currency,
      allowsOnlinePayment: service.allowsOnlinePayment,
      isActive: service.isActive,
    });
    setIsServiceModalOpen(true);
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
            Gestiona tus citas y servicios disponibles
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => {
              setSelectedService(null);
              resetServiceForm();
              setIsServiceModalOpen(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Servicio
          </button>
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
        {/* Services Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Mis Servicios
            </h3>
            <div className="space-y-3">
              {servicesData?.servicesByProvider && servicesData.servicesByProvider.length > 0 ? (
                servicesData.servicesByProvider.map((service: any) => (
                  <div
                    key={service.id}
                    className={`p-3 rounded-lg border ${
                      service.isActive
                        ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {service.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {service.durationMinutes} min
                        </p>
                        <p className="text-sm font-semibold text-[var(--fourth-base)] mt-1">
                          ${service.priceAmount.toLocaleString()} {service.currency}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          service.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200'
                        }`}
                      >
                        {service.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEditService(service)}
                      className="w-full px-2 py-1.5 text-xs bg-gray-400/80 text-white rounded-lg hover:opacity-90 transition-colors"
                    >
                      Editar Servicio
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No hay servicios creados
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
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
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: getStatusColor(apt.status) + '20',
                            color: getStatusColor(apt.status),
                          }}
                        >
                          {apt.status}
                        </span>
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

              {/* Customer Name */}
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
              {/* Customer email */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                  Correo Electrónico del Cliente
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

              {/* Customer Phone */}
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
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {selectedService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
              </h2>
              <button
                onClick={() => {
                  setIsServiceModalOpen(false);
                  setSelectedService(null);
                  resetServiceForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Nombre del Servicio
                </label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                  placeholder="Masaje Relajante"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Descripción
                </label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                  placeholder="Descripción del servicio..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    value={serviceForm.durationMinutes}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, durationMinutes: parseInt(e.target.value) })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                    min="15"
                    step="15"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2" />
                    Precio
                  </label>
                  <input
                    type="number"
                    value={serviceForm.priceAmount}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, priceAmount: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowsOnlinePayment"
                  checked={serviceForm.allowsOnlinePayment}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, allowsOnlinePayment: e.target.checked })
                  }
                  className="w-4 h-4 text-[var(--fourth-base)] border-gray-300 rounded focus:ring-[var(--fourth-base)]"
                />
                <label
                  htmlFor="allowsOnlinePayment"
                  className="text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                >
                  Permitir pago en línea
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={serviceForm.isActive}
                  onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-[var(--fourth-base)] border-gray-300 rounded focus:ring-[var(--fourth-base)]"
                />
                <label
                  htmlFor="isActive"
                  className="text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                >
                  Servicio activo
                </label>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => {
                  setIsServiceModalOpen(false);
                  setSelectedService(null);
                  resetServiceForm();
                }}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateService}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-fourth-base text-white rounded-lg hover:opacity-90 transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                <Check className="h-4 w-4 mr-2" />
                {selectedService ? 'Actualizar Servicio' : 'Crear Servicio'}
              </button>
            </div>
          </div>
        </div>
      )}

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
