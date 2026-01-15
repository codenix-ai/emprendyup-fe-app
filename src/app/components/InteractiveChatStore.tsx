/* eslint-disable @typescript-eslint/no-unused-vars, no-console */
'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Palette,
  MapPin,
  Phone,
  Mail,
  Building,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  MessageSquare,
  Bot,
  User,
} from 'lucide-react';
import FileUpload from './FileUpload';
import { gql, useMutation } from '@apollo/client';
import { useSessionStore } from '@/lib/store/dashboard';
import StoreSummary from './StoreSummary';
import RestaurantSummary from './RestaurantSummary';
import ServicesSummary from './ServicesSummary';
import Image from 'next/image';
import AdressAutocomplete from './AdressAutocomplete';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
// router not used in this component

interface Message {
  from: 'bot' | 'user';
  text: string;
  type?: 'text' | 'image' | 'color' | 'select';
  options?: string[];
  field?: string;
  validation?: ValidationRule;
  optional?: boolean;
}

interface ValidationRule {
  type: 'email' | 'phone' | 'url' | 'whatsapp' | 'text' | 'taxId';
  required?: boolean;
  message?: string;
}

interface StoreData {
  name: string;
  userId: string;
  storeId: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
  bannerUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  country: string;
  businessType: string;
  taxId: string;
  businessName: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  whatsappNumber: string;
  status: string;
  businessCategory?: 'products' | 'restaurant' | 'services' | 'tourism_services';
  coverImage?: string;
  googleLocation?: string;
  lat?: number;
  lng?: number;
  cuisineType?: string;
}

const businessTypeQuestion = {
  text: '¡Hola! 👋 Soy tu asistente para crear tu negocio online. ¿Qué tipo de emprendimiento tienes?',
  field: 'businessCategory',
  type: 'select' as const,
  options: ['Productos', 'Restaurante', 'Servicios', 'Servicios Turísticos'],
  validation: { type: 'text' as const, required: true, message: 'Debes seleccionar un tipo' },
};

const productsQuestions = [
  {
    text: '¡Perfecto! Vamos a crear tu tienda de productos. ¿Cuál es el nombre de tu emprendimiento?',
    field: 'name',
    type: 'text' as const,
    validation: { type: 'text' as const, required: true, message: 'El nombre es requerido' },
  },
  {
    text: 'Perfecto! Ahora cuéntame brevemente sobre tu negocio. ¿Qué productos o servicios ofreces?',
    field: 'description',
    type: 'text' as const,
    validation: { type: 'text' as const, required: false },
    optional: true,
  },
  {
    text: '¡Genial! Ahora vamos a darle identidad visual a tu tienda. Sube tu logo principal:',
    field: 'logoUrl',
    type: 'image' as const,
    validation: { type: 'url' as const, required: false },
    optional: true,
  },

  {
    text: '🎨 ¡Hora de los colores! Elige tu color principal (será el color dominante de tu tienda):',
    field: 'primaryColor',
    type: 'color' as const,
    validation: { type: 'text' as const, required: true },
  },
  {
    text: 'Ahora elige un color secundario (para textos y elementos de apoyo):',
    field: 'secondaryColor',
    type: 'color' as const,
    validation: { type: 'text' as const, required: false },
    optional: true,
  },
  {
    text: 'Elige un color de acento (para botones y elementos destacados):',
    field: 'accentColor',
    type: 'color' as const,
    validation: { type: 'text' as const, required: false },
    optional: true,
  },
  {
    text: '📱 ¿Cuál es tu número de celular?',
    field: 'phone',
    type: 'text' as const,
    validation: { type: 'phone' as const, required: false, message: 'Formato: +57 300 123 4567' },
    optional: true,
  },
  {
    text: '📍 ¿Cuál es tu dirección completa?',
    field: 'address',
    type: 'text' as const,
    validation: { type: 'text' as const, required: false },
    optional: true,
  },
  {
    text: '¿En qué ciudad te encuentras?',
    field: 'city',
    type: 'select' as const,
    options: [
      'Bogotá',
      'Medellín',
      'Cali',
      'Barranquilla',
      'Cartagena',
      'Bucaramanga',
      'Manizales',
      'Pereira',
      'Cúcuta',
      'Santa Marta',
      'Otra',
    ],
    validation: { type: 'text' as const, required: true, message: 'La ciudad es requerida' },
  },
  // {
  //   text: '🏢 Información legal: ¿Qué tipo de negocio es?',
  //   field: 'businessType',
  //   type: 'select' as const,
  //   options: ['Persona Natural', 'SAS', 'LTDA', 'SA', 'Fundación', 'Cooperativa'],
  //   validation: { type: 'text' as const, required: true },
  // },

  // {
  //   text: '¿Cuál es tu número de identificación tributaria (NIT/RUT)?',
  //   field: 'taxId',
  //   type: 'text' as const,
  //   validation: { type: 'taxId' as const, required: false, message: 'Formato: 123456789-1' },
  //   optional: true,
  // },
  // {
  //   text: '¿Cuál es la razón social de tu empresa? (Si aplica)',
  //   field: 'businessName',
  //   type: 'text' as const,
  //   validation: { type: 'text' as const, required: false },
  //   optional: true,
  // },
  {
    text: '📱 Redes sociales (opcional): ¿Tienes Facebook? Comparte tu URL:',
    field: 'facebookUrl',
    type: 'text' as const,
    validation: {
      type: 'url' as const,
      required: false,
      message: 'Ejemplo: https://facebook.com/tupagina',
    },
    optional: true,
  },
  {
    text: '📸 ¿Tienes Instagram? Comparte tu URL:',
    field: 'instagramUrl',
    type: 'text' as const,
    validation: {
      type: 'url' as const,
      required: false,
      message: 'Ejemplo: https://instagram.com/tuusuario',
    },
    optional: true,
  },
  {
    text: '🐦 ¿Tienes Twitter/X? Comparte tu URL:',
    field: 'twitterUrl',
    type: 'text' as const,
    validation: {
      type: 'url' as const,
      required: false,
      message: 'Ejemplo: https://twitter.com/tuusuario',
    },
    optional: true,
  },
  {
    text: '🎥 ¿Tienes YouTube? Comparte tu URL:',
    field: 'youtubeUrl',
    type: 'text' as const,
    validation: {
      type: 'url' as const,
      required: false,
      message: 'Ejemplo: https://youtube.com/c/tucanal',
    },
    optional: true,
  },
  {
    text: '🎵 ¿Tienes TikTok? Comparte tu URL:',
    field: 'tiktokUrl',
    type: 'text' as const,
    validation: {
      type: 'url' as const,
      required: false,
      message: 'Ejemplo: https://tiktok.com/tuusuario',
    },
    optional: true,
  },
];

const restaurantQuestions = [
  {
    text: '🍽️ ¡Excelente! Vamos a crear tu restaurante. ¿Cuál es el nombre?',
    field: 'name',
    type: 'text' as const,
    validation: { type: 'text' as const, required: true, message: 'El nombre es requerido' },
  },
  {
    text: '🍕 ¿Qué tipo de cocina ofreces?',
    field: 'cuisineType',
    type: 'select' as const,
    options: [
      'Comida Rápida',
      'Italiana',
      'Mexicana',
      'China',
      'Japonesa',
      'Colombiana',
      'Internacional',
      'Vegetariana/Vegana',
      'Mariscos',
      'Carnes',
      'Parrilla',
      'Postres',
      'Cafetería',
      'Otra',
    ],
    validation: {
      type: 'text' as const,
      required: true,
      message: 'El tipo de cocina es requerido',
    },
  },
  {
    text: '📍 ¿En qué ciudad se encuentra tu restaurante?',
    field: 'city',
    type: 'select' as const,
    options: [
      'Bogotá',
      'Medellín',
      'Cali',
      'Barranquilla',
      'Cartagena',
      'Bucaramanga',
      'Manizales',
      'Pereira',
      'Cúcuta',
      'Santa Marta',
      'Otra',
    ],
    validation: { type: 'text' as const, required: true, message: 'La ciudad es requerida' },
  },
  {
    text: '🎨 Sube el logo de tu restaurante:',
    field: 'logoUrl',
    type: 'image' as const,
    validation: { type: 'url' as const, required: false },
    optional: true,
  },
  // {
  //   text: '🖼️ Sube el favicon (ícono de pestaña):',
  //   field: 'faviconUrl',
  //   type: 'image' as const,
  //   validation: { type: 'url' as const, required: false },
  //   optional: true,
  // },
  // {
  //   text: '🌆 Sube una imagen de banner:',
  //   field: 'bannerUrl',
  //   type: 'image' as const,
  //   validation: { type: 'url' as const, required: false },
  //   optional: true,
  // },
  {
    text: '🎨 Elige tu color principal (color primario):',
    field: 'primaryColor',
    type: 'color' as const,
    validation: { type: 'text' as const, required: false },
    optional: true,
  },
  {
    text: '🎨 Elige tu color secundario:',
    field: 'secondaryColor',
    type: 'color' as const,
    validation: { type: 'text' as const, required: false },
    optional: true,
  },
  {
    text: '📱 ¿Cuál es el teléfono de contacto?',
    field: 'phone',
    type: 'text' as const,
    validation: { type: 'phone' as const, required: true, message: 'Formato: +57 300 123 4567' },
  },
  {
    text: '🏠 ¿Cuál es la dirección completa?',
    field: 'address',
    type: 'text' as const,
    validation: { type: 'text' as const, required: true, message: 'La dirección es requerida' },
  },
  {
    text: '📱 Redes sociales (opcional): ¿Tienes Facebook?',
    field: 'facebookUrl',
    type: 'text' as const,
    validation: { type: 'url' as const, required: false },
    optional: true,
  },
  {
    text: '📸 ¿Tienes Instagram?',
    field: 'instagramUrl',
    type: 'text' as const,
    validation: { type: 'url' as const, required: false },
    optional: true,
  },
  {
    text: '🐦 ¿Tienes Twitter/X?',
    field: 'twitterUrl',
    type: 'text' as const,
    validation: { type: 'url' as const, required: false },
    optional: true,
  },
  // {
  //   text: '🗺️ ¿Tienes un enlace de Google Maps?',
  //   field: 'googleLocation',
  //   type: 'text' as const,
  //   validation: { type: 'url' as const, required: false },
  //   optional: true,
  // },
  // {
  //   text: '🏢 ¿Cuál es el NIT/RUT de tu negocio?',
  //   field: 'taxId',
  //   type: 'text' as const,
  //   validation: { type: 'taxId' as const, required: false },
  //   optional: true,
  // },
  // {
  //   text: '🏢 ¿Cuál es la razón social?',
  //   field: 'businessName',
  //   type: 'text' as const,
  //   validation: { type: 'text' as const, required: false },
  //   optional: true,
  // },
  // {
  //   text: '🏢 Tipo de negocio:',
  //   field: 'businessType',
  //   type: 'select' as const,
  //   options: ['Persona Natural', 'SAS', 'LTDA', 'SA', 'Fundación', 'Cooperativa'],
  //   validation: { type: 'text' as const, required: false },
  //   optional: true,
  // },
];

const servicesQuestions = [
  {
    text: '✨ ¡Genial! Vamos a crear tu empresa de servicios. ¿Cuál es el nombre del negocio?',
    field: 'name',
    type: 'text' as const,
    validation: { type: 'text' as const, required: true, message: 'El nombre es requerido' },
  },
  {
    text: '🏷️ ¿Qué tipo de servicio ofreces?',
    field: 'businessType',
    type: 'select' as const,
    options: [
      'Terapia',
      'Salón de Belleza',
      'Consultor',
      'Entrenador',
      'Servicio de Limpieza',
      'Servicio de Reparación',
      'Fotografía',
      'Planificación de Eventos',
      'Servicio Legal',
      'Contabilidad',
      'Marketing',
      'Otro',
    ],
    validation: {
      type: 'text' as const,
      required: true,
      message: 'El tipo de servicio es requerido',
    },
  },
  {
    text: '📍 ¿En qué ciudad ofreces tus servicios?',
    field: 'city',
    type: 'select' as const,
    options: [
      'Bogotá',
      'Medellín',
      'Cali',
      'Barranquilla',
      'Cartagena',
      'Bucaramanga',
      'Manizales',
      'Pereira',
      'Cúcuta',
      'Santa Marta',
      'Otra',
    ],
    validation: { type: 'text' as const, required: true, message: 'La ciudad es requerida' },
  },
  {
    text: '🎨 Sube el logo de tu empresa:',
    field: 'logoUrl',
    type: 'image' as const,
    validation: { type: 'url' as const, required: false },
    optional: true,
  },
  // {
  //   text: '🖼️ Sube el favicon (ícono de pestaña):',
  //   field: 'faviconUrl',
  //   type: 'image' as const,
  //   validation: { type: 'url' as const, required: false },
  //   optional: true,
  // },
  // {
  //   text: '🌆 Sube una imagen de banner:',
  //   field: 'bannerUrl',
  //   type: 'image' as const,
  //   validation: { type: 'url' as const, required: false },
  //   optional: true,
  // },

  {
    text: '🎨 Elige tu color principal:',
    field: 'primaryColor',
    type: 'color' as const,
    validation: { type: 'text' as const, required: false },
    optional: true,
  },
  {
    text: '🎨 Elige tu color secundario:',
    field: 'secondaryColor',
    type: 'color' as const,
    validation: { type: 'text' as const, required: false },
    optional: true,
  },
  {
    text: '📱 ¿Cuál es el teléfono de contacto?',
    field: 'phone',
    type: 'text' as const,
    validation: { type: 'phone' as const, required: true, message: 'Formato: +57 300 123 4567' },
  },
  {
    text: '🏠 ¿Cuál es tu dirección?',
    field: 'address',
    type: 'text' as const,
    validation: { type: 'text' as const, required: true, message: 'La dirección es requerida' },
  },
  {
    text: '📱 Redes sociales (opcional): ¿Tienes Facebook?',
    field: 'facebookUrl',
    type: 'text' as const,
    validation: { type: 'url' as const, required: false },
    optional: true,
  },
  {
    text: '📸 ¿Tienes Instagram?',
    field: 'instagramUrl',
    type: 'text' as const,
    validation: { type: 'url' as const, required: false },
    optional: true,
  },
  {
    text: '🐦 ¿Tienes Twitter/X?',
    field: 'twitterUrl',
    type: 'text' as const,
    validation: { type: 'url' as const, required: false },
    optional: true,
  },
  // {
  //   text: '🏢 ¿Cuál es el NIT/RUT de tu negocio?',
  //   field: 'taxId',
  //   type: 'text' as const,
  //   validation: { type: 'taxId' as const, required: false },
  //   optional: true,
  // },
  // {
  //   text: '🏢 ¿Cuál es la razón social?',
  //   field: 'businessName',
  //   type: 'text' as const,
  //   validation: { type: 'text' as const, required: false },
  //   optional: true,
  // },
];

const defaultStoreData: StoreData = {
  name: '',
  userId: '',
  storeId: '',
  description: '',
  logoUrl: '',
  faviconUrl: '',
  bannerUrl: '',
  primaryColor: '#3B82F6',
  secondaryColor: '#1F2937',
  accentColor: '#10B981',
  backgroundColor: '#FFFFFF',
  textColor: '#111827',
  email: '',
  phone: '',
  address: '',
  city: '',
  department: '',
  country: 'Colombia',
  businessType: '',
  taxId: '',
  businessName: '',
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  youtubeUrl: '',
  tiktokUrl: '',
  whatsappNumber: '',
  status: 'active',
  businessCategory: undefined,
  coverImage: '',
  googleLocation: '',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - suppress unused parameter-name warning in the function type annotation
function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const presetColors = [
    '#3B82F6',
    '#EF4444',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#6B7280',
    '#1F2937',
  ];

  return (
    <div className="mt-2 space-y-3">
      <div className="flex gap-2 flex-wrap">
        {presetColors.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-full border-2 transition-transform ${
              value === color ? 'border-gray-800 scale-110' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-1 border rounded text-sm font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// GraphQL mutation to create a store
const CREATE_STORE = gql`
  mutation CreateStore($input: CreateStoreInput!) {
    createStore(input: $input) {
      id
      storeId
      name
      platform
      shopUrl
      status
      userId
      createdAt
      logoUrl
      faviconUrl
      bannerUrl
      primaryColor
      secondaryColor
      accentColor
      backgroundColor
      textColor
      email
      phone
      address
      city
      department
      country
      businessType
      taxId
      businessName
      facebookUrl
      instagramUrl
      twitterUrl
      youtubeUrl
      tiktokUrl
      whatsappNumber
      status
    }
  }
`;

const CREATE_RESTAURANT = gql`
  mutation CreateRestaurantWithBranding($input: CreateRestaurantWithBrandingInput!) {
    createRestaurantWithBranding(input: $input) {
      id
      name
      slug
      description
      cuisineType
      city
      logoUrl
      primaryColor
      secondaryColor
      lat
      lng
      address
      phone
      brandingId
      businessConfigId
      createdAt
      updatedAt
    }
  }
`;

const CREATE_TOURISM_COMPANY = gql`
  mutation CreateTourismCompany($input: CreateTourismCompanyInput!) {
    createTourismCompany(input: $input) {
      id
      name
      description
      city
      address
      phone
      logoUrl
      coverImage
      googleLocation
      createdAt
      updatedAt
    }
  }
`;

const CREATE_SERVICE_PROVIDER = gql`
  mutation CreateServiceProviderWithBranding($input: CreateServiceProviderWithBrandingInput!) {
    createServiceProviderWithBranding(input: $input) {
      id
      businessName
      type
      phone
      email
      description
      logoUrl
      primaryColor
      secondaryColor
      location
      address
      whatsappNumber
      slug
      brandingId
      businessConfigId
      isActive
      createdAt
      updatedAt
    }
  }
`;

// @ts-ignore - suppress unused parameter-name warning in the function type annotation
function SelectInput({
  options,
  onSelect,
}: {
  options: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-black rounded-lg text-sm transition-colors border hover:border-blue-300"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default function InteractiveChatStore() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [input, setInput] = useState('');
  const [storeData, setStoreData] = useState<StoreData>(defaultStoreData);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdStoreId, setCreatedStoreId] = useState<string | null>(null);
  const [createdStore, setCreatedStore] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedBusinessType, setSelectedBusinessType] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [customCityOpen, setCustomCityOpen] = useState(false);
  const [customCityValue, setCustomCityValue] = useState('');
  const [customBusinessTypeOpen, setCustomBusinessTypeOpen] = useState(false);
  const [customBusinessTypeValue, setCustomBusinessTypeValue] = useState('');
  const [showDescriptionEdit, setShowDescriptionEdit] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [showSpecialtiesSelector, setShowSpecialtiesSelector] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);

  const [createStoreMutation] = useMutation(CREATE_STORE);
  const [createRestaurantMutation] = useMutation(CREATE_RESTAURANT);
  const [createTourismCompanyMutation] = useMutation(CREATE_TOURISM_COMPANY);
  const [createServiceProviderMutation] = useMutation(CREATE_SERVICE_PROVIDER);
  const session = useSessionStore();
  // hydrate session from server cookie if not present
  useEffect(() => {
    (async () => {
      try {
        if (!session?.user && session?.setUser) {
          const res = await fetch('/api/auth/me');
          if (!res.ok) return;
          const data = await res.json();
          const payload = data?.user?.payload;
          if (payload) {
            const userObj = {
              id: payload.sub || payload.user_id || payload.id || '',
              name: data.user?.name || payload.name || payload.email || '',
              email: payload.email || '',
              role: payload.role || 'user',
            } as any;
            session.setUser(userObj);
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to hydrate session from /api/auth/me', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Google Maps for inline address question
  const mapRef = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const initGoogleMaps = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está configurada');
      return;
    }
    try {
      setOptions({ key: apiKey });
    } catch (e) {
      // noop
    }
  };

  useEffect(() => {
    initGoogleMaps();
  }, []);

  const setMapRef = (node: HTMLDivElement | null) => {
    if (!node) return;
    mapContainerRef.current = node;

    if (!mapRef.current) {
      importLibrary('maps')
        .then((maps: any) => {
          mapRef.current = new maps.Map(node, {
            center: { lat: 4.60971, lng: -74.08175 },
            zoom: 14,
            mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
          });
        })
        .catch((err: any) => {
          // eslint-disable-next-line no-console
          console.error('Error loading Google Maps:', err);
        });
    }
  };

  const handlePlaceSelected = async (place: google.maps.places.PlaceResult) => {
    if (!place || !place.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    // Guardar en el storeData
    setStoreData((prev) => ({
      ...prev,
      address: place.formatted_address || '',
      lat,
      lng,
      googleLocation: place.url || prev.googleLocation,
    }));

    // Mostrar mensaje del usuario con la dirección seleccionada
    setMessages((prev) => [
      ...prev,
      { from: 'user', text: place.formatted_address || '', type: 'text' },
    ]);

    // Center map and show marker
    if (!mapRef.current && mapContainerRef.current) {
      try {
        const maps = (await importLibrary('maps')) as any;
        mapRef.current = new maps.Map(mapContainerRef.current, {
          center: { lat, lng },
          zoom: 16,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error inicializando mapa:', err);
      }
    }

    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(16);
      try {
        const markerLib = (await importLibrary('marker')) as google.maps.MarkerLibrary;
        if (!marker.current) {
          marker.current = new markerLib.AdvancedMarkerElement({
            map: mapRef.current,
            position: { lat, lng },
          });
        } else {
          marker.current.position = { lat, lng };
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Marker library not available or error creating marker', err);
      }
    }

    // Avanzar al siguiente paso
    if (currentStep + 1 < questions.length) {
      setCurrentStep((prev) => prev + 1);
      addBotMessage(currentStep + 1);
    } else {
      setCurrentStep(questions.length);
    }
  };

  // Obtener especialidades según el tipo de negocio
  const getSpecialtiesForType = (type: string, category: string): string[] => {
    if (category === 'restaurant') {
      const specialtiesMap: { [key: string]: string[] } = {
        'Comida Rápida': ['Hamburguesas', 'Hot Dogs', 'Papas Fritas', 'Pizza', 'Alitas'],
        Italiana: ['Pizza', 'Pasta', 'Risotto', 'Lasagna', 'Tiramisú'],
        Mexicana: ['Tacos', 'Burritos', 'Quesadillas', 'Enchiladas', 'Guacamole'],
        China: ['Arroz Frito', 'Chow Mein', 'Dim Sum', 'Wonton', 'Pollo Agridulce'],
        Japonesa: ['Sushi', 'Ramen', 'Tempura', 'Yakitori', 'Teriyaki'],
        Colombiana: ['Bandeja Paisa', 'Ajiaco', 'Sancocho', 'Empanadas', 'Arepa'],
        Internacional: ['Ensaladas', 'Carnes', 'Pescados', 'Sopas', 'Postres'],
        'Vegetariana/Vegana': ['Ensaladas', 'Bowls', 'Wraps', 'Smoothies', 'Tofu'],
        Mariscos: ['Ceviche', 'Camarones', 'Pulpo', 'Pescado Frito', 'Cazuela'],
        Carnes: ['Asado', 'Costillas', 'T-Bone', 'Churrasco', 'Parrillada'],
        Parrilla: ['Carne', 'Chorizo', 'Morcilla', 'Costillas', 'Pollo'],
        Postres: ['Tortas', 'Helados', 'Brownies', 'Cheesecake', 'Mousse'],
        Cafetería: ['Café', 'Cappuccino', 'Latte', 'Croissants', 'Muffins'],
      };
      return specialtiesMap[type] || ['Plato 1', 'Plato 2', 'Plato 3', 'Bebidas', 'Postres'];
    } else if (category === 'services') {
      const specialtiesMap: { [key: string]: string[] } = {
        Plomería: ['Reparaciones', 'Instalaciones', 'Destapes', 'Fugas', 'Mantenimiento'],
        Electricidad: ['Instalación', 'Reparación', 'Iluminación', 'Cableado', 'Emergencias'],
        Carpintería: ['Muebles', 'Reparaciones', 'Closets', 'Puertas', 'Ventanas'],
        Pintura: ['Interior', 'Exterior', 'Comercial', 'Residencial', 'Decorativa'],
        Limpieza: ['Residencial', 'Comercial', 'Profunda', 'Post-construcción', 'Oficinas'],
      };
      return (
        specialtiesMap[type] || ['Servicio 1', 'Servicio 2', 'Servicio 3', 'Consultoría', 'Soporte']
      );
    }
    return [];
  };

  const validateInput = (
    value: string,
    validation: ValidationRule
  ): { isValid: boolean; error?: string } => {
    if (!validation.required && (!value || value.trim() === '')) {
      return { isValid: true };
    }

    if (validation.required && (!value || value.trim() === '')) {
      return { isValid: false, error: validation.message || 'Este campo es requerido' };
    }

    switch (validation.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { isValid: false, error: 'Por favor ingresa un email válido' };
        }
        break;

      case 'phone':
        const phoneRegex = /^(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/;
        if (value && !phoneRegex.test(value.replace(/\s/g, ''))) {
          return { isValid: false, error: 'Formato válido: +57 300 123 4567' };
        }
        break;

      case 'whatsapp':
        const whatsappRegex = /^(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/;
        if (value && !whatsappRegex.test(value.replace(/\s/g, ''))) {
          return { isValid: false, error: 'Formato válido: +57 300 123 4567' };
        }
        break;
      case 'url':
        if (value && value.trim() !== '') {
          // Accept blob: and data: temporary URLs (used by browser previews)
          if (
            value.startsWith('blob:') ||
            value.startsWith('data:') ||
            /s3[.-]amazonaws[.-]com/.test(value)
          ) {
            break;
          }

          const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          if (!urlRegex.test(value)) {
            return { isValid: false, error: 'Por favor ingresa una URL válida' };
          }
        }
        break;

      case 'taxId':
        if (value && value.trim() !== '') {
          const taxIdRegex = /^\d{8,12}(-\d)?$/;
          if (!taxIdRegex.test(value)) {
            return { isValid: false, error: 'Formato válido: 123456789-1' };
          }
        }
        break;

      case 'text':
        if (validation.required && value.trim().length < 2) {
          return { isValid: false, error: 'Debe tener al menos 2 caracteres' };
        }
        break;
    }

    return { isValid: true };
  };

  useEffect(() => {
    // Initial bot message with typing animation - start with business type selection
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages([
        {
          from: 'bot',
          text: businessTypeQuestion.text,
          type: businessTypeQuestion.type,
          options: businessTypeQuestion.options,
          field: businessTypeQuestion.field,
        },
      ]);
    }, 1000);
  }, []);

  useEffect(() => {
    if (questions.length > 0) {
      setProgress((currentStep / questions.length) * 100);
    }
  }, [currentStep, questions.length]);

  // Auto-scroll to bottom on any message or typing change
  useEffect(() => {
    if (!bottomRef.current || !chatRef.current) return;
    try {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } catch (e) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const addBotMessage = (questionIndex: number) => {
    if (questionIndex >= questions.length) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            from: 'bot',
            text: '🎉 ¡Felicitaciones! Tu tienda está lista para ser creada. Hemos recopilado toda la información necesaria.',
            type: 'text',
          },
        ]);
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('✅ Datos completos de la tienda:', storeData);
        }
      }, 1500);
      return;
    }

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const question = questions[questionIndex];
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: question.text,
          type: question.type,
          options: question.options,
          field: question.field,
        },
      ]);
    }, 800);
  };

  const handleResponse = async (value: string) => {
    // Si aún no se ha seleccionado el tipo de negocio
    if (!selectedBusinessType && questions.length === 0) {
      // Guardar el tipo de negocio seleccionado
      let businessCategory: 'products' | 'restaurant' | 'services' | 'tourism_services';
      let questionsToUse: any[];

      if (value === 'Productos') {
        businessCategory = 'products';
        questionsToUse = productsQuestions;
      } else if (value === 'Restaurante') {
        businessCategory = 'restaurant';
        questionsToUse = restaurantQuestions;
      } else {
        businessCategory = 'services';
        questionsToUse = servicesQuestions;
      }

      setSelectedBusinessType(value);
      setStoreData((prev) => ({ ...prev, businessCategory }));
      setQuestions(questionsToUse);

      // Mostrar mensaje del usuario
      setMessages((prev) => [...prev, { from: 'user', text: value, type: 'text' }]);

      // Empezar con la primera pregunta del flujo seleccionado
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            from: 'bot',
            text: questionsToUse[0].text,
            type: questionsToUse[0].type,
            options: questionsToUse[0].options,
            field: questionsToUse[0].field,
          },
        ]);
        setCurrentStep(0);
      }, 800);

      setInput('');
      return;
    }

    const currentQuestion = questions[currentStep];
    const field = currentQuestion.field as keyof StoreData;

    // Normalize storeId if asking for it
    if (field === 'storeId') {
      let normalized = value.trim().toLowerCase();
      // replace spaces and hyphens with underscore, remove invalid chars
      normalized = normalized.replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
      value = normalized;
    }

    // If the user provided the store name, auto-generate storeId from name
    if (field === 'name') {
      const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      // only set storeId if it's empty to avoid overwriting explicit choices
      setStoreData((prev) => ({ ...prev, storeId: prev.storeId || normalized }));
    }

    // Validate input
    if (currentQuestion.validation) {
      const validation = validateInput(value, currentQuestion.validation);
      if (!validation.isValid) {
        setValidationError(validation.error || 'Entrada inválida');
        return;
      }
    }

    setValidationError(null);

    let displayValue = value;
    if ((!value || value.trim() === '') && currentQuestion.optional) {
      displayValue = '⏭️ Saltado';
    }
    const messageType = currentQuestion.type || 'text';
    setMessages((prev) => [...prev, { from: 'user', text: displayValue, type: messageType }]);

    // 📦 Guardar en storeData
    setStoreData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'phone' ? { whatsappNumber: value } : {}),
    }));

    // if we were in custom city flow, close it after receiving a manual city
    if (field === 'city' && customCityOpen) {
      setCustomCityOpen(false);
      setCustomCityValue('');
    }

    // if we were in custom business type flow, close it after receiving a manual type
    if (field === 'businessType' && customBusinessTypeOpen) {
      setCustomBusinessTypeOpen(false);
      setCustomBusinessTypeValue('');
    }

    // 🤖 Mostrar selector de especialidades para restaurantes
    if (field === 'cuisineType' && storeData.businessCategory === 'restaurant' && storeData.name) {
      const specialties = getSpecialtiesForType(value, 'restaurant');
      setAvailableSpecialties(specialties);
      setSelectedSpecialties([]);
      setShowSpecialtiesSelector(true);
      return; // Esperar a que el usuario seleccione especialidades
    }

    // 🤖 Mostrar selector de especialidades para servicios
    if (field === 'businessType' && storeData.businessCategory === 'services' && storeData.name) {
      const specialties = getSpecialtiesForType(value, 'services');
      setAvailableSpecialties(specialties);
      setSelectedSpecialties([]);
      setShowSpecialtiesSelector(true);
      return; // Esperar a que el usuario seleccione especialidades
    }

    // 🚀 Avanzar o mostrar resumen
    if (currentStep + 1 < questions.length) {
      // Todavía hay más preguntas
      setCurrentStep((prev) => prev + 1);
      addBotMessage(currentStep + 1);
    } else {
      setCurrentStep(questions.length);
      // NOTE: do not auto-open modal; user will click "Revisar información" to open it
    }

    // 🧹 Reset input
    setInput('');
  };

  // Auto-fill email from session when the email question appears
  useEffect(() => {
    const isEmailQuestion =
      currentStep < questions.length && questions[currentStep]?.field === 'email';
    const sessionEmail = (session as any)?.user?.email;
    if (isEmailQuestion && sessionEmail && !(storeData.email && storeData.email.length > 0)) {
      // small timeout so UI updates feel natural
      const t = setTimeout(() => handleResponse(sessionEmail), 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, (session as any)?.user?.email]);

  // Helper to open summary ensuring email is present in storeData (from session if available)
  const openSummary = () => {
    const sessionEmail = (session as any)?.user?.email;
    setStoreData((prev) => ({
      ...prev,
      email: prev.email || sessionEmail || '',
      whatsappNumber: prev.whatsappNumber || prev.phone || '',
    }));
    setShowSummary(true);
  };

  const handleSkip = () => {
    const currentQuestion = questions[currentStep];
    if (currentQuestion.optional) {
      setValidationError(null);
      handleResponse('');
    }
  };

  const handleSend = () => {
    if (!input.trim() && !questions[currentStep]?.optional) return;
    handleResponse(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (msg: Message) => {
    const isImageUrl = (value: string) => {
      if (!value) return false;
      if (value.startsWith('blob:') || value.startsWith('data:')) return true;
      // try URL parsing to inspect hostname and pathname
      try {
        const u = new URL(value);
        const path = (u.pathname || '').toLowerCase();
        if (path.match(/\.(png|jpe?g|gif|webp|avif|svg)$/)) return true;
        if (
          /s3[.-]amazonaws[.-]com/.test(u.hostname) ||
          u.hostname.includes('emprendyup-images.s3.us-east-1.amazonaws.com')
        )
          return true;
        return false;
      } catch (e) {
        return value.match(/\.(png|jpe?g|gif|webp|avif|svg)$/i) !== null;
      }
    };

    const messageIsImage = isImageUrl(msg.text);

    if (messageIsImage) {
      return (
        <Image
          src={msg.text}
          alt="Uploaded"
          width={80}
          height={80}
          className="w-20 h-20 object-cover rounded-lg"
          unoptimized={msg.text.startsWith('blob:') || msg.text.startsWith('data:')}
        />
      );
    }

    const isHttpUrl = msg.text.startsWith('http://') || msg.text.startsWith('https://');
    if (isHttpUrl) {
      return (
        <a
          href={msg.text}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-200 underline"
        >
          {msg.text}
        </a>
      );
    }

    switch (msg.type) {
      case 'image':
        return (
          <div>
            <span>{msg.text}</span>
            {questions.length > 0 &&
              currentStep === questions.findIndex((q) => q.field === msg.field) && (
                <div>
                  <FileUpload
                    onFile={handleResponse}
                    accept="image/*"
                    storeId={storeData?.storeId}
                  />
                  {msg.optional && (
                    <button
                      onClick={handleSkip}
                      className="mt-3 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                    >
                      <span>⏭️</span>
                      Saltar imagen
                    </button>
                  )}
                </div>
              )}
          </div>
        );
      case 'color':
        return (
          <div>
            <span>{msg.text}</span>
            {questions.length > 0 &&
              currentStep === questions.findIndex((q) => q.field === msg.field) && (
                <div>
                  <ColorPicker
                    value={storeData[msg.field as keyof StoreData] as string}
                    onChange={handleResponse}
                  />
                  {msg.optional && (
                    <button
                      onClick={handleSkip}
                      className="mt-3 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                    >
                      <span>⏭️</span>
                      Usar color por defecto
                    </button>
                  )}
                </div>
              )}
          </div>
        );

      case 'select':
        return (
          <div>
            <span>{msg.text}</span>
            {/* Mostrar opciones si es la pregunta de tipo de negocio (businessCategory) O si es la pregunta actual */}
            {((msg.field === 'businessCategory' && !selectedBusinessType) ||
              (questions.length > 0 &&
                currentStep === questions.findIndex((q) => q.field === msg.field))) &&
              msg.options && (
                <div>
                  {/* Handle custom input for city field */}
                  {msg.field === 'city' ? (
                    <div>
                      {!customCityOpen ? (
                        <SelectInput
                          options={msg.options}
                          onSelect={(val: string) => {
                            if (val === 'Otra') {
                              setCustomCityOpen(true);
                            } else {
                              handleResponse(val);
                            }
                          }}
                        />
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={customCityValue}
                            onChange={(e) => setCustomCityValue(e.target.value)}
                            placeholder="Escribe tu ciudad"
                            className="flex-1 px-3 py-2 rounded border bg-slate-700 text-white"
                          />
                          <button
                            onClick={() => {
                              if (customCityValue.trim()) {
                                handleResponse(customCityValue.trim());
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 rounded text-white"
                          >
                            Aceptar
                          </button>
                        </div>
                      )}
                    </div>
                  ) : msg.field === 'businessType' && storeData.businessCategory === 'services' ? (
                    /* Handle custom input for service businessType field */
                    <div>
                      {!customBusinessTypeOpen ? (
                        <SelectInput
                          options={msg.options}
                          onSelect={(val: string) => {
                            if (val === 'Otro') {
                              setCustomBusinessTypeOpen(true);
                            } else {
                              handleResponse(val);
                            }
                          }}
                        />
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={customBusinessTypeValue}
                            onChange={(e) => setCustomBusinessTypeValue(e.target.value)}
                            placeholder="Escribe el tipo de servicio"
                            className="flex-1 px-3 py-2 rounded border bg-slate-700 text-white"
                          />
                          <button
                            onClick={() => {
                              if (customBusinessTypeValue.trim()) {
                                handleResponse(customBusinessTypeValue.trim());
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 rounded text-white"
                          >
                            Aceptar
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <SelectInput options={msg.options} onSelect={handleResponse} />
                    </div>
                  )}

                  {msg.optional && (
                    <button
                      onClick={handleSkip}
                      className="mt-3 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                    >
                      <span>⏭️</span>
                      Saltar selección
                    </button>
                  )}
                </div>
              )}
          </div>
        );

      default:
        if (msg.field === 'address' && storeData.businessCategory === 'restaurant') {
          return (
            <div>
              <span>{msg.text}</span>
              <div className="mt-3">
                <AdressAutocomplete onPlaceSelected={handlePlaceSelected} />
                <div className="mt-2 rounded-md overflow-hidden">
                  <div ref={setMapRef} style={{ height: 200 }} />
                </div>
              </div>
            </div>
          );
        }

        return <span>{msg.text}</span>;
    }
  };

  const getMessageIcon = (field?: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      email: <Mail className="w-4 h-4" />,
      phone: <Phone className="w-4 h-4" />,
      address: <MapPin className="w-4 h-4" />,
      city: <MapPin className="w-4 h-4" />,
      department: <MapPin className="w-4 h-4" />,
      businessType: <Building className="w-4 h-4" />,
      primaryColor: <Palette className="w-4 h-4" />,
      secondaryColor: <Palette className="w-4 h-4" />,
      accentColor: <Palette className="w-4 h-4" />,
      facebookUrl: <Facebook className="w-4 h-4" />,
      instagramUrl: <Instagram className="w-4 h-4" />,
      twitterUrl: <Twitter className="w-4 h-4" />,
      youtubeUrl: <Youtube className="w-4 h-4" />,
      whatsappNumber: <MessageSquare className="w-4 h-4" />,
    };
    return iconMap[field || ''] || null;
  };
  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 min-h-screen">
      <div className="bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with progress */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-800 p-6 text-white">
          <h1 className="text-2xl font-bold mb-2 text-white">Asistente creacion emprendimiento</h1>
          <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-300">
            {questions.length > 0
              ? `Paso ${currentStep + 1} de ${questions.length} • ${Math.round(progress)}% completado`
              : 'Selecciona el tipo de emprendimiento para comenzar'}
          </p>
        </div>
        {/* Chat Area */}
        <div ref={chatRef} className="h-96 overflow-y-auto p-6 space-y-4 bg-slate-800">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.from === 'user' ? 'justify-end items-end' : 'justify-start items-start'}`}
            >
              {/* For bot messages: avatar on the left, then bubble. For user messages: bubble first, then avatar on the right */}

              {msg.from === 'bot' && (
                <div className="flex-shrink-0 mr-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-md p-4 rounded-2xl shadow-sm transform transition-all duration-300 hover:scale-[1.02] ${
                  msg.from === 'bot'
                    ? 'bg-slate-700 border-l-4 border-indigo-500 text-slate-200 animate-slide-in-left'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white animate-slide-in-right'
                }`}
              >
                {msg.from === 'bot' && (
                  <div className="flex items-center gap-2 mb-2">
                    {getMessageIcon(msg.field)}
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                )}
                {renderMessageContent(msg)}
              </div>

              {msg.from === 'user' && (
                <div className="flex-shrink-0 ml-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              {/* Bot Avatar for typing indicator */}
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="bg-slate-700 p-4 rounded-2xl shadow-sm animate-pulse">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Campo de edición de descripción con diseño mejorado */}
        {showDescriptionEdit && tempDescription && (
          <div className="px-6 py-4 bg-gradient-to-br from-slate-800 to-slate-900 border-t border-slate-700 shadow-inner">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✨</span>
                <label className="text-sm font-medium text-slate-300">
                  Descripción generada por IA
                </label>
              </div>
              <div className="relative">
                <textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700/50 text-white border-2 border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 placeholder-slate-400 shadow-sm hover:border-slate-500"
                  placeholder="Edita la descripción aquí..."
                />
                <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                  {tempDescription.length} caracteres
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <span>💡</span>
                  Puedes modificar el texto antes de continuar
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStoreData((prev) => ({
                        ...prev,
                        description: tempDescription,
                      }));
                      setShowDescriptionEdit(false);
                      setMessages((prev) => [
                        ...prev,
                        {
                          from: 'user',
                          text: `📝 ${tempDescription}`,
                          type: 'text',
                        },
                      ]);
                      setTempDescription('');
                      // Avanzar al siguiente paso
                      if (currentStep + 1 < questions.length) {
                        setCurrentStep((prev) => prev + 1);
                        addBotMessage(currentStep + 1);
                      } else {
                        setCurrentStep(questions.length);
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 shadow-md flex items-center gap-1"
                  >
                    <span>✅</span>
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Specialties Selector */}
        {showSpecialtiesSelector && (
          <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-t border-slate-700">
            <div className="max-w-2xl mx-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>✨</span>
                  Selecciona tus especialidades
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Elige al menos 3 especialidades para generar una mejor descripción
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {availableSpecialties.map((specialty) => (
                  <button
                    key={specialty}
                    onClick={() => {
                      setSelectedSpecialties((prev) =>
                        prev.includes(specialty)
                          ? prev.filter((s) => s !== specialty)
                          : [...prev, specialty]
                      );
                    }}
                    className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                      selectedSpecialties.includes(specialty)
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {selectedSpecialties.includes(specialty) && <span className="mr-1">✓</span>}
                    {specialty}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-400">
                  {selectedSpecialties.length} seleccionada
                  {selectedSpecialties.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowSpecialtiesSelector(false);
                      setSelectedSpecialties([]);
                      // Avanzar sin especialidades
                      if (currentStep + 1 < questions.length) {
                        setCurrentStep((prev) => prev + 1);
                        addBotMessage(currentStep + 1);
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
                  >
                    Omitir
                  </button>
                  <button
                    onClick={async () => {
                      if (selectedSpecialties.length === 0) {
                        return;
                      }

                      setShowSpecialtiesSelector(false);

                      // Generar descripción con IA
                      const isRestaurant = storeData.businessCategory === 'restaurant';
                      try {
                        setIsTyping(true);
                        const requestBody = {
                          name: storeData.name,
                          type: isRestaurant ? 'restaurant' : 'service',
                          category: isRestaurant ? storeData.cuisineType : storeData.businessType,
                          city: storeData.city || 'Bogotá',
                          specialties: selectedSpecialties,
                          tone: isRestaurant ? 'elegant' : 'professional',
                          language: 'es',
                        };

                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                        console.log('🚀 Enviando request a IA:', requestBody);

                        const response = await fetch(`${apiUrl}/ai/description/generate`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(requestBody),
                        });

                        console.log('📡 Response status:', response.status, response.statusText);

                        // 200 OK o 201 Created son válidos
                        if (response.ok || response.status === 201) {
                          const result = await response.json();
                          console.log('✅ Respuesta de IA:', result);
                          if (result.data.description) {
                            setTempDescription(result.data.description);
                            setIsTyping(false);
                            setShowDescriptionEdit(true);
                          } else {
                            console.warn('⚠️ No se encontró description en la respuesta:', result);
                            // Intentar de todas formas mostrar el editor con mensaje de error
                            setTempDescription(
                              'No se pudo generar una descripción. Por favor, escribe una manualmente.'
                            );
                            setIsTyping(false);
                            setShowDescriptionEdit(true);
                          }
                        } else {
                          console.error(
                            '❌ Error en la respuesta:',
                            response.status,
                            response.statusText
                          );
                          const errorText = await response.text();
                          console.error('Error details:', errorText);
                          // Mostrar editor con mensaje de error
                          setTempDescription(
                            'Hubo un error al generar la descripción. Por favor, escribe una manualmente.'
                          );
                          setIsTyping(false);
                          setShowDescriptionEdit(true);
                        }
                      } catch (error) {
                        console.error('💥 Error generando descripción:', error);
                        // Mostrar editor con mensaje de error
                        setTempDescription(
                          'Error de conexión. Por favor, escribe una descripción manualmente.'
                        );
                        setIsTyping(false);
                        setShowDescriptionEdit(true);
                      } finally {
                        setIsTyping(false);
                      }
                    }}
                    disabled={selectedSpecialties.length === 0}
                    className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-md flex items-center gap-2"
                  >
                    <span>✨</span>
                    Generar Descripción
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        {/* Mostrar input cuando estamos en preguntas normales O cuando aún no se ha seleccionado tipo de negocio */}
        {!showDescriptionEdit &&
          !showSpecialtiesSelector &&
          ((questions.length > 0 && currentStep < questions.length) ||
            (questions.length === 0 && !selectedBusinessType)) &&
          messages.length > 0 &&
          messages[messages.length - 1]?.from === 'bot' &&
          // hide standard text input when address question for restaurants (we render autocomplete inline)
          !(
            questions.length > 0 &&
            questions[currentStep]?.field === 'address' &&
            storeData.businessCategory === 'restaurant'
          ) &&
          !['image', 'color', 'select'].includes(
            questions.length > 0
              ? questions[currentStep]?.type
              : messages[messages.length - 1]?.type
          ) && (
            <div className="p-6 bg-slate-800 border-t border-slate-700">
              {validationError && (
                <div className="mb-4 p-3 bg-red-900/40 border-l-4 border-red-500 text-red-300 rounded animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">⚠️</span>
                    {validationError}
                  </div>
                  {questions.length > 0 && questions[currentStep]?.validation?.message && (
                    <p className="text-sm mt-1 text-red-300">
                      💡 {questions[currentStep]?.validation?.message}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setValidationError(null);
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    questions.length > 0
                      ? `Responde: ${questions[currentStep]?.text.split('?')[0]}...`
                      : 'Escribe tu respuesta...'
                  }
                  className={`flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors text-slate-200 placeholder-slate-400 ${
                    validationError
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />

                <div className="flex gap-2">
                  {questions.length > 0 && questions[currentStep]?.optional && (
                    <button
                      onClick={handleSkip}
                      className="px-4 py-3 bg-slate-700 text-slate-200 rounded-xl hover:bg-slate-600 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                      title="Saltar pregunta opcional"
                    >
                      <span>⏭️</span>
                      Saltar
                    </button>
                  )}

                  <button
                    onClick={handleSend}
                    disabled={
                      !input.trim() && questions.length > 0 && !questions[currentStep]?.optional
                    }
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar
                  </button>
                </div>
              </div>

              {questions.length > 0 && questions[currentStep]?.optional && (
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <span>💡</span>
                  Esta pregunta es opcional - puedes saltarla si no aplica
                </p>
              )}
            </div>
          )}

        {questions.length > 0 && currentStep >= questions.length && (
          <div className="mt-6">
            {createdStoreId ? (
              // Mensaje de éxito cuando el negocio ya fue creado
              <div className="text-center space-y-4 py-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white text-2xl">✓</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {storeData.businessCategory === 'restaurant'
                    ? '¡Tu restaurante ha sido creado!'
                    : storeData.businessCategory === 'tourism_services'
                      ? '¡Tu empresa de servicios ha sido creada!'
                      : '¡Tu tienda ha sido creada!'}
                </h2>
                <p className="text-slate-300">
                  Proximamente recibirás un email con los detalles de acceso.
                </p>
                <div className="flex items-center justify-center gap-4">
                  {(() => {
                    // Build a friendly URL depending on the created resource type.
                    // - For stores (products), prefer `shopUrl` or subdomain: `https://{storeId}.emprendyup.com`.
                    // - For restaurants/services/tourism_services, prefer a path using `slug`: `https://emprendyup.com/{slug}`.
                    const category =
                      (createdStore && createdStore.businessCategory) || storeData.businessCategory;

                    // If the created resource is a restaurant or service, prefer slug paths
                    if (
                      category === 'restaurant' ||
                      category === 'services' ||
                      category === 'tourism_services'
                    ) {
                      const slug = createdStore?.slug || createdStoreId;
                      if (slug)
                        return (
                          <a
                            href={`https://${slug}.emprendyup.com`}
                            className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ir a website
                          </a>
                        );
                    }

                    // Default/store behavior: prefer explicit shopUrl, then storeId subdomain, then createdStoreId as subdomain
                    if (createdStore?.shopUrl) {
                      return (
                        <a
                          href={createdStore.shopUrl}
                          className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ir a la tienda
                        </a>
                      );
                    }

                    if (createdStore?.storeId) {
                      return (
                        <a
                          href={`https://${createdStore.storeId}.emprendyup.com`}
                          className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ir a la tienda
                        </a>
                      );
                    }

                    if (createdStoreId) {
                      return (
                        <a
                          href={`https://${createdStoreId}.emprendyup.com`}
                          className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ir a la tienda
                        </a>
                      );
                    }

                    // Fallback
                    return (
                      <a
                        href="https://emprendyup.com"
                        className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ir a la tienda
                      </a>
                    );
                  })()}
                </div>
              </div>
            ) : (
              // Botón para revisar datos antes de crear (cuando aún no se ha creado)
              <>
                <div className="text-center mb-4 text-slate-300">
                  <button
                    onClick={() => openSummary()}
                    className="px-6 pl-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                    disabled={creating}
                  >
                    {creating
                      ? storeData.businessCategory === 'restaurant'
                        ? 'Creando restaurante...'
                        : storeData.businessCategory === 'services'
                          ? 'Creando empresa...'
                          : 'Creando tienda...'
                      : 'Revisar información'}
                  </button>
                </div>

                {/* Modal - Usar el componente correcto según el tipo de negocio */}
                {storeData.businessCategory === 'restaurant' ? (
                  <RestaurantSummary
                    open={showSummary}
                    onClose={() => setShowSummary(false)}
                    data={createdStore || storeData}
                    onConfirm={async (updatedData) => {
                      setCreateError(null);
                      setCreating(true);
                      try {
                        let created: any = null;

                        // Crear restaurante con branding
                        const input = {
                          name: updatedData.name,
                          description: updatedData.description || '',
                          cuisineType: updatedData.cuisineType,
                          city: updatedData.city,
                          logoUrl: updatedData.logoUrl || '',
                          primaryColor: updatedData.primaryColor || '#3B82F6',
                          secondaryColor: updatedData.secondaryColor || '#1F2937',
                          address: updatedData.address,
                          lat: (updatedData.lat ?? storeData.lat) || null,
                          lng: (updatedData.lng ?? storeData.lng) || null,
                          phone: updatedData.phone,
                          googleLocation: updatedData.googleLocation || '',
                          branding: {
                            logoUrl: updatedData.logoUrl || '',
                            // faviconUrl: updatedData.faviconUrl || '',
                            // bannerUrl: updatedData.bannerUrl || '',
                            coverImageUrl: updatedData.coverImage || '',
                            primaryColor: updatedData.primaryColor || '#3B82F6',
                            secondaryColor: updatedData.secondaryColor || '#1F2937',
                            accentColor: updatedData.accentColor || '#10B981',
                            backgroundColor: updatedData.backgroundColor || '#FFFFFF',
                            textColor: updatedData.textColor || '#111827',
                          },
                          businessConfig: {
                            email: updatedData.email,
                            phone: updatedData.phone,
                            whatsappNumber: updatedData.whatsappNumber || updatedData.phone,
                            address: updatedData.address,
                            city: updatedData.city,
                            department: updatedData.department || '',
                            country: updatedData.country || 'Colombia',
                            facebookUrl: updatedData.facebookUrl || '',
                            instagramUrl: updatedData.instagramUrl || '',
                            twitterUrl: updatedData.twitterUrl || '',
                            metaTitle: `${updatedData.name} - ${updatedData.cuisineType}`,
                            metaDescription:
                              updatedData.description ||
                              `Restaurante de ${updatedData.cuisineType} en ${updatedData.city}`,
                            metaKeywords: `restaurante, ${updatedData.cuisineType}, ${updatedData.city}`,
                            currency: 'COP',
                            language: 'es',
                            timezone: 'America/Bogota',
                            taxId: updatedData.taxId || '',
                            businessName: updatedData.businessName || updatedData.name,
                            businessType: updatedData.businessType || 'Restaurante',
                          },
                        };
                        const { data } = await createRestaurantMutation({ variables: { input } });
                        created = data?.createRestaurantWithBranding;
                        if (created) {
                          setCreatedStoreId(created.id);
                          setCreatedStore(created);
                        }

                        setShowSummary(false);
                      } catch (err: any) {
                        setCreateError(err?.message || 'Error al crear el restaurante');
                      } finally {
                        setCreating(false);
                      }
                    }}
                  />
                ) : storeData.businessCategory === 'services' ? (
                  <ServicesSummary
                    open={showSummary}
                    onClose={() => setShowSummary(false)}
                    data={createdStore || storeData}
                    onConfirm={async (updatedData) => {
                      setCreateError(null);
                      setCreating(true);
                      try {
                        let created: any = null;

                        // Crear proveedor de servicios con branding
                        const slug = updatedData.name
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, '');

                        const input = {
                          businessName: updatedData.name,
                          type: updatedData.businessType || 'OTHER',
                          description: updatedData.description || '',
                          logoUrl: updatedData.logoUrl || '',
                          primaryColor: updatedData.primaryColor || '#7C3AED',
                          secondaryColor: updatedData.secondaryColor || '#1F2937',
                          location: `${updatedData.city}, ${updatedData.department || 'Colombia'}`,
                          address: updatedData.address,
                          phone: updatedData.phone,
                          whatsappNumber: updatedData.whatsappNumber || updatedData.phone,
                          email: updatedData.email,
                          slug,
                          isActive: true,
                          branding: {
                            logoUrl: updatedData.logoUrl || '',
                            // faviconUrl: updatedData.faviconUrl || '',
                            // bannerUrl: updatedData.bannerUrl || '',
                            coverImageUrl: updatedData.coverImage || '',
                            primaryColor: updatedData.primaryColor || '#7C3AED',
                            secondaryColor: updatedData.secondaryColor || '#1F2937',
                            accentColor: updatedData.accentColor || '#10B981',
                            backgroundColor: updatedData.backgroundColor || '#F9FAFB',
                            textColor: updatedData.textColor || '#111827',
                          },
                          businessConfig: {
                            email: updatedData.email,
                            phone: updatedData.phone,
                            whatsappNumber: updatedData.whatsappNumber || updatedData.phone,
                            address: updatedData.address,
                            city: updatedData.city,
                            department: updatedData.department || '',
                            country: updatedData.country || 'Colombia',
                            facebookUrl: updatedData.facebookUrl || '',
                            instagramUrl: updatedData.instagramUrl || '',
                            twitterUrl: updatedData.twitterUrl || '',
                            metaTitle: `${updatedData.name} - Servicios Profesionales`,
                            metaDescription:
                              updatedData.description ||
                              `Servicios profesionales en ${updatedData.city}`,
                            metaKeywords: `servicios, ${updatedData.businessType}, ${updatedData.city}`,
                            currency: 'COP',
                            language: 'es',
                            timezone: 'America/Bogota',
                            taxId: updatedData.taxId || '',
                            businessName: updatedData.businessName || updatedData.name,
                            businessType: updatedData.businessType || 'Servicios',
                          },
                        };
                        const { data } = await createServiceProviderMutation({
                          variables: { input },
                        });
                        created = data?.createServiceProviderWithBranding;
                        if (created) {
                          setCreatedStoreId(created.id);
                          setCreatedStore(created);
                        }

                        setShowSummary(false);
                      } catch (err: any) {
                        setCreateError(err?.message || 'Error al crear la empresa de servicios');
                      } finally {
                        setCreating(false);
                      }
                    }}
                  />
                ) : (
                  <StoreSummary
                    open={showSummary}
                    onClose={() => setShowSummary(false)}
                    data={createdStore || storeData}
                    onConfirm={async (updatedData) => {
                      setCreateError(null);
                      setCreating(true);
                      try {
                        let created: any = null;

                        // Crear tienda de productos (flujo original)
                        // Filtrar solo los campos válidos para CreateStoreInput
                        const { businessCategory, coverImage, googleLocation, ...validStoreData } =
                          updatedData;

                        const input = {
                          ...validStoreData,
                          status: 'active',
                          userId: session?.user?.id || 'anonymous',
                        };
                        const { data } = await createStoreMutation({ variables: { input } });
                        created = data?.createStore;
                        if (created) {
                          setCreatedStoreId(created.storeId);
                          setCreatedStore(created);
                          session.setCurrentStore?.(created as any);
                          session.addStore?.(created as any);
                        }

                        setShowSummary(false);
                      } catch (err: any) {
                        setCreateError(err?.message || 'Error al crear la tienda');
                      } finally {
                        setCreating(false);
                      }
                    }}
                  />
                )}
              </>
            )}

            {/* Mostrar error si existe */}
            {createError && (
              <div className="mt-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded">
                {createError}
              </div>
            )}

            {/* Mostrar estado de creación */}
            {creating && (
              <div className="mt-4 p-3 bg-blue-900 border border-blue-700 text-blue-300 rounded flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                {storeData.businessCategory === 'restaurant'
                  ? 'Creando restaurante...'
                  : storeData.businessCategory === 'services'
                    ? 'Creando empresa de servicios...'
                    : 'Creando tienda...'}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
