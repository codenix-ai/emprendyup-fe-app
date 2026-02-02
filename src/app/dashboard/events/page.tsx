'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Users,
  Search,
  Download,
  Mail,
  Phone,
  Building2,
  MapPin,
  Ticket,
  MoreVertical,
  Plus,
  X,
  DollarSign,
  CheckCircle,
  XCircle,
  Send,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { gql, useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';

const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      title
      description
      eventType
      startDate
      endDate
      timezone
      location
      venue
      address
      city
      country
      isVirtual
      maxAttendees
      registrationFee
      currency
      organizerName
      organizerEmail
      organizerPhone
      createdAt
    }
  }
`;

const GET_EVENT_ASSISTANTS = gql`
  query GetEventAssistants($filter: EventAssistantFilterInput) {
    eventAssistants(filter: $filter) {
      id
      firstName
      lastName
      email
      phone
      company
      position
      city
      country
      eventId
      status
      paymentStatus
      paymentAmount
      paymentReference
      paymentDate
      registeredAt
      qrCode
      ticketNumber
      checkedInAt
      notes
      metadata
      createdAt
      updatedAt
      event {
        id
        title
        startDate
        endDate
      }
    }
  }
`;

const UPDATE_ASSISTANT_METADATA = gql`
  mutation UpdateAssistantMetadata($id: ID!, $metadata: JSON!) {
    updateEventAssistant(id: $id, input: { metadata: $metadata }) {
      id
      metadata
    }
  }
`;

const GET_EVENTS = gql`
  query GetEvents($filter: EventFilterInput) {
    events(filter: $filter) {
      id
      title
      description
      eventType
      status
      isPublished
      isVirtual
      startDate
      endDate
      timezone
      location
      venue
      address
      city
      country
      virtualUrl
      coverImageUrl
      registrationFee
      currency
      maxAttendees
      currentAttendees
      organizerName
      organizerEmail
      organizerPhone
      tags
      metadata
      publishedAt
      createdAt
      updatedAt
      assistants {
        id
        firstName
        lastName
        email
        status
        paymentStatus
        registeredAt
      }
    }
  }
`;

// Tipos de TypeScript
interface Event {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  status: string;
  isPublished: boolean;
  isVirtual: boolean;
  startDate: string;
  endDate: string;
  timezone: string;
  location: string;
  venue?: string;
  address?: string;
  city: string;
  country: string;
  virtualUrl?: string;
  coverImageUrl?: string;
  registrationFee: number;
  currency: string;
  maxAttendees: number;
  currentAttendees: number;
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  tags?: string[];
  metadata?: any;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  capacity: number;
  price: number;
  assistants?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    paymentStatus: string;
    registeredAt: string;
  }>;
}

interface SimpleEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
}

interface EventAssistant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  city?: string;
  country?: string;
  eventId: string;
  status: string;
  paymentStatus: string;
  paymentAmount?: number;
  paymentReference?: string;
  paymentDate?: string;
  registeredAt: string;
  checkInCode?: string;
  qrCode?: string;
  ticketNumber?: string;
  checkedInAt?: string;
  notes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  event: SimpleEvent;
}

// Traduce estados conocidos al español y deja un fallback legible
const translateStatusLabel = (val: string) => {
  if (!val) return val;
  const key = val.toString().toUpperCase();
  const map: Record<string, string> = {
    REGISTERED: 'Registrado',
    DRAFT: 'Borrador',
    CONFIRMED: 'Confirmado',
    PENDING: 'Pendiente',
    CANCELLED: 'Cancelado',
    PAID: 'Pagado',
    FAILED: 'Fallido',
    CHECKED_IN: 'Registrado',
    DRAFT_EVENT: 'Borrador',
  };

  if (map[key]) return map[key];

  return val
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Componente de Badge para estados
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
      case 'PAID':
      case 'CHECKED_IN':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusStyle()}`}
    >
      {translateStatusLabel(status)}
    </span>
  );
};

// Componente AssistantCard para móvil
const AssistantCard = ({
  assistant,
  isSelected,
  onToggleSelect,
}: {
  assistant: EventAssistant;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}) => (
  <div
    onClick={() => onToggleSelect(assistant.id)}
    className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 hover:shadow-md transition-all cursor-pointer ${
      isSelected
        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
        : 'border-gray-200 dark:border-gray-700'
    }`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {assistant.firstName} {assistant.lastName}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{assistant.email}</p>
        </div>
        {assistant.phone && (
          <div className="flex items-center gap-1 mt-1">
            <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{assistant.phone}</p>
          </div>
        )}
      </div>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(assistant.id)}
        className="accent-green-600 h-5 w-5 mt-1"
        onClick={(e) => e.stopPropagation()}
      />
    </div>

    <div className="space-y-2 mb-3">
      {assistant.company && (
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {assistant.company}
            {assistant.position && ` - ${assistant.position}`}
          </span>
        </div>
      )}
      {(assistant.city || assistant.country) && (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {[assistant.city, assistant.country].filter(Boolean).join(', ')}
          </span>
        </div>
      )}
    </div>

    <div className="flex flex-wrap items-center gap-2 mb-3">
      <StatusBadge status={assistant.status} />
      {assistant.ticketNumber && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
          <Ticket className="h-3 w-3" />
          {assistant.ticketNumber}
        </span>
      )}
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <Calendar className="h-3 w-3 inline mr-1" />
        {assistant.event.title}
      </div>
      {assistant.paymentAmount && (
        <div className="text-sm font-semibold text-gray-900 dark:text-white">
          ${assistant.paymentAmount.toLocaleString()}
        </div>
      )}
    </div>
  </div>
);

const EventsPage = () => {
  // Base URL for event registration - can be moved to environment variable if needed
  const EVENT_REGISTRATION_BASE_URL = 'https://www.emprendy.ai/registro-evento';

  const {
    data: assistantsData,
    loading: assistantsLoading,
    error: assistantsError,
    refetch: refetchAssistants,
  } = useQuery(GET_EVENT_ASSISTANTS);
  const {
    data: eventsData,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useQuery(GET_EVENTS);
  const [createEvent] = useMutation(CREATE_EVENT);
  const [updateAssistantMetadata] = useMutation(UPDATE_ASSISTANT_METADATA);
  const [activeTab, setActiveTab] = useState<'assistants' | 'events'>('assistants');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [localToast, setLocalToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'WORKSHOP',
    startDate: '',
    endDate: '',
    timezone: 'America/Bogota',
    location: '',
    venue: '',
    address: '',
    city: '',
    country: 'Colombia',
    isVirtual: false,
    maxAttendees: 50,
    registrationFee: 0,
    currency: 'COP',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
  });

  // Obtener datos según el tab activo - memoize to prevent dependency issues
  const assistants: EventAssistant[] = useMemo(
    () => assistantsData?.eventAssistants || [],
    [assistantsData]
  );
  const eventsList: Event[] = useMemo(() => eventsData?.events || [], [eventsData]);
  const loading = activeTab === 'assistants' ? assistantsLoading : eventsLoading;
  const error = activeTab === 'assistants' ? assistantsError : eventsError;

  // Obtener eventos únicos desde asistentes
  const eventsFromAssistants = useMemo(() => {
    const eventMap = new Map();
    // Agregar eventos desde asistentes
    assistants.forEach((assistant) => {
      if (assistant.event) {
        eventMap.set(assistant.event.id, assistant.event);
      }
    });
    // También agregar eventos desde la lista general para asegurar que el dropdown incluya todos
    eventsList.forEach((e) => {
      if (e && e.id) {
        eventMap.set(e.id, {
          id: e.id,
          title: e.title,
          startDate: e.startDate,
          endDate: e.endDate,
        });
      }
    });

    return Array.from(eventMap.values());
  }, [assistants, eventsList]);

  // Filtrar asistentes
  const filteredAssistants = useMemo(() => {
    return assistants.filter((assistant) => {
      const matchesSearch =
        assistant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assistant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assistant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assistant.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assistant.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (assistant.status || '').toUpperCase() === statusFilter.toUpperCase();
      const matchesPaymentStatus =
        paymentStatusFilter === 'all' ||
        (assistant.paymentStatus || '').toUpperCase() === paymentStatusFilter.toUpperCase();
      const matchesEvent =
        selectedEvent === 'all' || (assistant.eventId || '').toString() === selectedEvent;

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesEvent;
    });
  }, [searchTerm, statusFilter, paymentStatusFilter, selectedEvent, assistants]);

  // Filtrar eventos para la pestaña 'events'
  const filteredEvents = useMemo(() => {
    return eventsList.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.organizerName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || (event.status || '').toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [eventsList, searchTerm, statusFilter]);

  // Opciones dinámicas de estado y estado de pago extraídas de los datos
  const assistantStatusOptions = useMemo(() => {
    const s = new Set<string>();
    assistants.forEach((a) => a.status && s.add(a.status));
    return Array.from(s);
  }, [assistants]);

  const paymentStatusOptions = useMemo(() => {
    const s = new Set<string>();
    assistants.forEach((a) => a.paymentStatus && s.add(a.paymentStatus));
    return Array.from(s);
  }, [assistants]);

  const eventStatusOptions = useMemo(() => {
    const s = new Set<string>();
    eventsList.forEach((e) => e && e.status && s.add(e.status));
    return Array.from(s);
  }, [eventsList]);

  const combinedStatusOptions = useMemo(() => {
    const s = new Set<string>([...assistantStatusOptions, ...eventStatusOptions]);
    return Array.from(s);
  }, [assistantStatusOptions, eventStatusOptions]);

  const translateStatusLabel = (val: string) => {
    if (!val) return val;
    const key = val.toString().toUpperCase();
    const map: Record<string, string> = {
      REGISTERED: 'Registrado',
      DRAFT: 'Borrador',
      CONFIRMED: 'Confirmado',
      PENDING: 'Pendiente',
      CANCELLED: 'Cancelado',
      PAID: 'Pagado',
      FAILED: 'Fallido',
      CHECKED_IN: 'Registrado',
      // eventos
      DRAFT_EVENT: 'Borrador',
    };

    if (map[key]) return map[key];

    // Fallback: beautify (replace underscores, title case)
    return val
      .toString()
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createEvent({
        variables: {
          input: {
            ...formData,
            maxAttendees: parseInt(formData.maxAttendees.toString()),
            registrationFee: parseFloat(formData.registrationFee.toString()),
          },
        },
      });

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        eventType: 'WORKSHOP',
        startDate: '',
        endDate: '',
        timezone: 'America/Bogota',
        location: '',
        venue: '',
        address: '',
        city: '',
        country: 'Colombia',
        isVirtual: false,
        maxAttendees: 50,
        registrationFee: 0,
        currency: 'COP',
        organizerName: '',
        organizerEmail: '',
        organizerPhone: '',
      });
      setShowCreateModal(false);
      refetchEvents();
      refetchAssistants();
      setLocalToast({ message: 'Evento creado exitosamente', type: 'success' });
    } catch (error) {
      console.error('Error creating event:', error);
      setLocalToast({
        message: 'Error al crear el evento. Por favor, inténtalo de nuevo.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (localToast) {
      const timer = setTimeout(() => {
        setLocalToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [localToast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopyLink = (eventId: string) => {
    const link = `${EVENT_REGISTRATION_BASE_URL}?id=${eventId}`;

    // Check if Clipboard API is available
    if (!navigator.clipboard) {
      toast.error('Tu navegador no soporta copiar al portapapeles automáticamente');
      return;
    }

    navigator.clipboard
      .writeText(link)
      .then(() => {
        toast.success('Link copiado al portapapeles');
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
        toast.error('Error al copiar el link. Por favor, intenta de nuevo.');
      });
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Nombre',
      'Apellido',
      'Email',
      'Teléfono',
      'Empresa',
      'Posición',
      'Ciudad',
      'País',
      'Estado',
      'Estado Pago',
      'Monto',
      'Número Ticket',
      'Fecha Registro',
      'Check-in',
      'Evento',
    ];

    const rows = filteredAssistants.map((a) => [
      a.id,
      a.firstName,
      a.lastName,
      a.email,
      a.phone || '',
      a.company || '',
      a.position || '',
      a.city || '',
      a.country || '',
      a.status,
      a.paymentStatus,
      a.paymentAmount || '',
      a.ticketNumber || '',
      formatDate(a.registeredAt),
      a.checkedInAt ? formatDate(a.checkedInAt) : 'No',
      a.event.title,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistentes-eventos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // WhatsApp Campaign Functions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAssistants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssistants.map((a) => a.id));
    }
  };

  const handleSendWhatsAppCampaign = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecciona al menos un asistente.');
      return;
    }

    setIsSendingCampaign(true);

    try {
      // Construir phoneNumbers y parameters
      const phoneNumbers: string[] = [];
      const parameters: Record<
        string,
        Array<{ type: string; parameter_name: string; text: string }>
      > = {};
      // Get or generate assigned numbers for each assistant
      selectedIds.forEach((id, index) => {
        const assistant = assistants.find((a) => a.id === id);
        if (!assistant) return;

        // Format phone number with +57 prefix if not present
        let phone = assistant.phone || '';
        if (!phone.startsWith('+')) {
          phone = `+57${phone}`;
        }
        phoneNumbers.push(phone);

        // Use the ticket number as the identifier to send to the user
        const ticketNumber = assistant.ticketNumber || 'N/A';

        // Build parameters: name and ticket number
        parameters[phone] = [
          {
            type: 'text',
            parameter_name: '1',
            text: `${assistant.firstName} ${assistant.lastName}`, // Full name
          },
          {
            type: 'text',
            parameter_name: '2',
            text: ticketNumber, // Send the actual ticket number
          },
        ];
      });

      console.log('📦 Final payload parameters:', JSON.stringify(parameters, null, 2));

      const payload = {
        phoneNumbers,
        templateName: process.env.NEXT_PUBLIC_WS_EVENTS_TEMPLATE_ID,
        languageCode: 'es',
        parameters,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Error del servidor:', errorData);
          toast.error(`Error al enviar la campaña: ${errorData.message || response.statusText}`);
        } else {
          const text = await response.text();
          console.error('Respuesta no JSON:', text);
          toast.error(
            'Error al enviar la campaña: El servidor respondió con un formato inesperado.'
          );
        }
        return;
      }

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();

        toast.success(
          `✅ Campaña procesada: ${data.success} exitosos, ${data.failed} fallidos de ${data.total} total.`
        );
        // Clear selection after successful send
        setSelectedIds([]);
      } else {
        const text = await response.text();
        console.error('Respuesta no JSON:', text);
        toast.error('La campaña fue enviada pero la respuesta no es JSON. Revisa la consola.');
      }
    } catch (error) {
      console.error('Error general al enviar la campaña:', error);
      toast.error('Hubo un error al enviar la campaña. Revisa la consola.');
    } finally {
      setIsSendingCampaign(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando asistentes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
              Error al cargar asistentes
            </h3>
            <p className="text-red-600 dark:text-red-400">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      {/* Toast Notification */}
      {localToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
              localToast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
            }`}
          >
            {localToast.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{localToast.message}</span>
            <button
              onClick={() => setLocalToast(null)}
              className="ml-2 hover:opacity-70 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Crear Nuevo Evento
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Información Básica */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Información Básica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Título del Evento *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: Gran Lanzamiento EmprendyUp"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Describe los detalles del evento..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Evento *
                    </label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="WORKSHOP">Workshop</option>
                      <option value="CONFERENCE">Conferencia</option>
                      <option value="WEBINAR">Webinar</option>
                      <option value="NETWORKING">Networking</option>
                      <option value="MEETUP">Meetup</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Zona Horaria *
                    </label>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="America/Bogota">Bogotá (GMT-5)</option>
                      <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                      <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
                      <option value="America/Santiago">Santiago (GMT-3)</option>
                      <option value="America/Lima">Lima (GMT-5)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fechas y Horarios */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fechas y Horarios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha y Hora de Inicio *
                    </label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha y Hora de Fin *
                    </label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ubicación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="isVirtual"
                      checked={formData.isVirtual}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Evento Virtual
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lugar/URL *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={
                        formData.isVirtual ? 'https://zoom.us/j/123456' : 'Centro de Eventos Bogotá'
                      }
                    />
                  </div>

                  {!formData.isVirtual && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Recinto/Sede
                        </label>
                        <input
                          type="text"
                          name="venue"
                          value={formData.venue}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Auditorio Principal"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Dirección
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Calle 100 #15-20"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ciudad *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Bogotá"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          País *
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Colombia"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Capacidad y Precio */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Capacidad y Precio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Máx. Asistentes *
                    </label>
                    <input
                      type="number"
                      name="maxAttendees"
                      value={formData.maxAttendees}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Precio de Registro *
                    </label>
                    <input
                      type="number"
                      name="registrationFee"
                      value={formData.registrationFee}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Moneda *
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="COP">COP - Peso Colombiano</option>
                      <option value="USD">USD - Dólar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="MXN">MXN - Peso Mexicano</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Información del Organizador */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Información del Organizador
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="organizerName"
                      value={formData.organizerName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="EmprendyUp"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="organizerEmail"
                      value={formData.organizerEmail}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="eventos@emprendyup.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="organizerPhone"
                      value={formData.organizerPhone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="+573001234567"
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Crear Evento
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Eventos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona eventos y monitorea los asistentes registrados
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'events' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-fit"
              >
                <Plus className="h-4 w-4" />
                Crear Evento
              </button>
            )}
            {activeTab === 'assistants' && selectedIds.length > 0 && (
              <button
                onClick={handleSendWhatsAppCampaign}
                disabled={isSendingCampaign}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-fit disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {isSendingCampaign ? 'Enviando...' : `Enviar WhatsApp (${selectedIds.length})`}
              </button>
            )}
            <button
              onClick={exportToCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-fit"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, email, empresa o ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos los eventos</option>
                {eventsFromAssistants.map((event: any) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos los estados</option>
                {combinedStatusOptions.length === 0 ? (
                  <>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="PENDING">Pendiente</option>
                    <option value="CANCELLED">Cancelado</option>
                  </>
                ) : (
                  combinedStatusOptions.map((s) => (
                    <option key={s} value={s}>
                      {translateStatusLabel(s)}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 w-fit">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('assistants')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'assistants'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="h-4 w-4" />
              Asistentes
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'events'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Eventos
            </button>
          </div>
        </div>

        {/* Assistants List */}
        {activeTab === 'assistants' && (
          <>
            {filteredAssistants.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay asistentes
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ||
                  statusFilter !== 'all' ||
                  paymentStatusFilter !== 'all' ||
                  selectedEvent !== 'all'
                    ? 'No se encontraron asistentes con los filtros aplicados.'
                    : 'No hay asistentes registrados en el sistema.'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1 mb-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {filteredAssistants.length} asistente
                        {filteredAssistants.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={
                            selectedIds.length === filteredAssistants.length &&
                            filteredAssistants.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="accent-green-600 h-5 w-5"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Seleccionar todos
                        </span>
                      </div>
                    </div>
                    {filteredAssistants.map((assistant) => (
                      <AssistantCard
                        key={assistant.id}
                        assistant={assistant}
                        isSelected={selectedIds.includes(assistant.id)}
                        onToggleSelect={toggleSelect}
                      />
                    ))}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  <div className="flex grid-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Asistentes ({filteredAssistants.length})
                    </h2>
                  </div>{' '}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                          <th className="px-6 py-4 text-left">
                            <input
                              type="checkbox"
                              checked={
                                selectedIds.length === filteredAssistants.length &&
                                filteredAssistants.length > 0
                              }
                              onChange={toggleSelectAll}
                              className="accent-green-600 h-4 w-4"
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Asistente
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Empresa
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Evento
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Ticket
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredAssistants.map((assistant) => (
                          <tr
                            key={assistant.id}
                            className={`transition-colors ${
                              selectedIds.includes(assistant.id)
                                ? 'bg-green-50 dark:bg-green-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(assistant.id)}
                                onChange={() => toggleSelect(assistant.id)}
                                className="accent-green-600 h-4 w-4"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {assistant.firstName} {assistant.lastName}
                                </div>
                                {(assistant.city || assistant.country) && (
                                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {[assistant.city, assistant.country].filter(Boolean).join(', ')}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-900 dark:text-white">
                                    {assistant.email}
                                  </span>
                                </div>
                                {assistant.phone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {assistant.phone}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {assistant.company ? (
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {assistant.company}
                                  </div>
                                  {assistant.position && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {assistant.position}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {assistant.event.title}
                                </div>
                                <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(assistant.event.startDate)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={assistant.status} />
                            </td>

                            <td className="px-6 py-4">
                              {assistant.ticketNumber ? (
                                <div className="flex items-center gap-2">
                                  <Ticket className="h-4 w-4 text-blue-600" />
                                  <code className="text-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                    {assistant.ticketNumber}
                                  </code>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Events List */}
        {activeTab === 'events' && (
          <>
            {eventsList.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay eventos
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No hay eventos creados en el sistema.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400 px-1">
                      {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
                    </div>
                    {filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                {event.eventType}
                              </span>
                              {event.isVirtual && (
                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                                  Virtual
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDate(event.startDate)} - {formatDate(event.endDate)}
                            </span>
                          </div>
                          {!event.isVirtual && event.venue && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <MapPin className="h-4 w-4" />
                              <span>{event.venue}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Users className="h-4 w-4" />
                            <span>
                              {event.assistants?.length || 0} / {event.capacity} asistentes
                            </span>
                          </div>
                          {event.price > 0 && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <DollarSign className="h-4 w-4" />
                              <span>${event.price.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Organizado por {event.organizerName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  <div className="flex grid-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Eventos ({filteredEvents.length})
                    </h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Evento
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Fechas
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Ubicación
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Asistentes
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Organizador
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Compartir
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredEvents.map((event) => (
                          <tr
                            key={event.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {event.title}
                                </div>
                                {event.description && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                    {event.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium w-fit">
                                  {event.eventType}
                                </span>
                                {event.isVirtual && (
                                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium w-fit">
                                    Virtual
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(event.startDate)}
                                </div>
                                <div className="text-gray-500 dark:text-gray-400 mt-1">
                                  hasta {formatDate(event.endDate)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {event.isVirtual ? (
                                <span className="text-sm text-purple-600 dark:text-purple-400">
                                  Online
                                </span>
                              ) : event.venue ? (
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {event.venue}
                                  </div>
                                  {event.address && (
                                    <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {event.address}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {event.assistants?.length || 0} / {event.capacity}
                                </span>
                              </div>
                              {event.price > 0 && (
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  <DollarSign className="h-3 w-3" />${event.price.toLocaleString()}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {event.organizerName}
                                </div>
                                {event.organizerEmail && (
                                  <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                    <Mail className="h-3 w-3" />
                                    {event.organizerEmail}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleCopyLink(event.id)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Copiar link de registro"
                              >
                                <Share2 className="h-4 w-4" />
                                Copiar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
