export type ContactVariant = 'card' | 'split' | 'minimal';

export interface ContactSectionProps {
  variant: ContactVariant;
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
  showForm: boolean;
  submitText: string;
  visible: boolean;
}

export const CONTACT_SECTION_DEFAULTS: ContactSectionProps = {
  variant: 'card',
  title: 'Contáctanos',
  subtitle: 'Estamos aquí para ayudarte',
  email: '',
  phone: '',
  address: '',
  showForm: true,
  submitText: 'Enviar mensaje',
  visible: true,
};
