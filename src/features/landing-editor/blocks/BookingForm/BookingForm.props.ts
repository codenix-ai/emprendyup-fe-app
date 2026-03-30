export type BookingVariant = 'card' | 'fullwidth';

export interface BookingField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'time' | 'select' | 'textarea';
  required: boolean;
  options?: string[]; // for select
}

export interface BookingFormProps {
  variant: BookingVariant;
  title: string;
  subtitle: string;
  fields: BookingField[];
  submitText: string;
  successMessage: string;
  visible: boolean;
}

export const BOOKING_FORM_DEFAULTS: BookingFormProps = {
  variant: 'card',
  title: 'Reserva tu lugar',
  subtitle: 'Completa el formulario y te confirmaremos tu reserva',
  fields: [
    { name: 'name', label: 'Nombre completo', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Teléfono', type: 'tel', required: false },
    { name: 'date', label: 'Fecha', type: 'date', required: true },
    { name: 'time', label: 'Hora', type: 'time', required: true },
    { name: 'notes', label: 'Comentarios', type: 'textarea', required: false },
  ],
  submitText: 'Confirmar reserva',
  successMessage: '¡Reserva confirmada! Te contactaremos pronto.',
  visible: true,
};
