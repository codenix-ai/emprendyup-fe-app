/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars, no-console */
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Barlow_Condensed, Outfit } from 'next/font/google';
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
  User,
  ShoppingBag,
  UtensilsCrossed,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-barlow',
});
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-outfit',
});

type AvatarState = 'idle' | 'talking' | 'thinking' | 'happy';

function AvatarLuna({ state, accent }: { state: AvatarState; accent: string }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 120,
          height: 120,
          background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Rotating ring — thinking */}
      {state === 'thinking' && (
        <motion.div
          className="absolute rounded-full border-2 border-transparent"
          style={{
            width: 100,
            height: 100,
            borderTopColor: accent,
            borderRightColor: accent + '44',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Pulse ring — talking */}
      {state === 'talking' && (
        <motion.div
          className="absolute rounded-full border"
          style={{ width: 100, height: 100, borderColor: accent }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      {/* Idle steady ring */}
      {(state === 'idle' || state === 'happy') && (
        <motion.div
          className="absolute rounded-full border"
          style={{ width: 96, height: 96, borderColor: accent + '55' }}
          animate={state === 'happy' ? { scale: [1, 1.18, 1], opacity: [1, 0.3, 1] } : {}}
          transition={{ duration: 0.7, repeat: state === 'happy' ? 3 : 0 }}
        />
      )}

      {/* Face circle */}
      <div
        className="relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden z-10"
        style={{
          background: 'linear-gradient(145deg, #1a1d2e, #0d0f1a)',
          boxShadow: `0 0 24px ${accent}33, inset 0 1px 0 ${accent}22`,
        }}
      >
        <svg viewBox="0 0 60 60" className="w-14 h-14">
          {/* Eyebrows — thinking */}
          {state === 'thinking' && (
            <>
              <motion.line
                x1="14"
                y1="18"
                x2="24"
                y2="16"
                stroke={accent}
                strokeWidth="2"
                strokeLinecap="round"
                animate={{ y1: [18, 16, 18], y2: [16, 14, 16] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.line
                x1="36"
                y1="16"
                x2="46"
                y2="18"
                stroke={accent}
                strokeWidth="2"
                strokeLinecap="round"
                animate={{ y1: [16, 14, 16], y2: [18, 16, 18] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </>
          )}

          {/* Left eye */}
          <motion.ellipse
            cx="20"
            cy="25"
            rx="4"
            ry="4"
            fill={accent}
            animate={
              state === 'idle' || state === 'happy'
                ? { ry: [4, 4, 0.4, 4, 4] }
                : state === 'thinking'
                  ? { cx: [20, 21, 20] }
                  : {}
            }
            transition={
              state === 'idle' || state === 'happy'
                ? { duration: 4, repeat: Infinity, delay: 1, times: [0, 0.4, 0.5, 0.6, 1] }
                : { duration: 1.5, repeat: Infinity }
            }
          />

          {/* Right eye */}
          <motion.ellipse
            cx="40"
            cy="25"
            rx="4"
            ry="4"
            fill={accent}
            animate={
              state === 'idle' || state === 'happy'
                ? { ry: [4, 4, 0.4, 4, 4] }
                : state === 'thinking'
                  ? { cx: [40, 41, 40] }
                  : {}
            }
            transition={
              state === 'idle' || state === 'happy'
                ? { duration: 4, repeat: Infinity, delay: 1, times: [0, 0.4, 0.5, 0.6, 1] }
                : { duration: 1.5, repeat: Infinity }
            }
          />

          {/* Mouth */}
          {state === 'happy' ? (
            <motion.path
              d="M16 38 Q30 50 44 38"
              stroke={accent}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          ) : state === 'thinking' ? (
            <motion.line
              x1="22"
              y1="42"
              x2="38"
              y2="42"
              stroke={accent}
              strokeWidth="2.5"
              strokeLinecap="round"
              animate={{ x1: [22, 24, 22], x2: [38, 36, 38] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          ) : state === 'talking' ? (
            <motion.path
              d="M20 40 Q30 47 40 40"
              stroke={accent}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              animate={{ d: ['M20 40 Q30 47 40 40', 'M20 40 Q30 44 40 40', 'M20 40 Q30 47 40 40'] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
          ) : (
            <path
              d="M21 40 Q30 46 39 40"
              stroke={accent}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Sparkle dots for happy */}
          {state === 'happy' && (
            <>
              <motion.circle
                cx="10"
                cy="12"
                r="2"
                fill="#FFD233"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, delay: 0.3, repeat: 3 }}
              />
              <motion.circle
                cx="50"
                cy="12"
                r="2"
                fill="#FFD233"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, delay: 0.5, repeat: 3 }}
              />
            </>
          )}
        </svg>

        {/* Sound wave bars for talking */}
        {state === 'talking' && (
          <div className="absolute bottom-1 flex items-end gap-0.5">
            {[0.6, 1, 0.7, 1.2, 0.8].map((h, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full"
                style={{ background: accent }}
                animate={{ height: [3, h * 8, 3] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import FileUpload from './FileUpload';
import { gql, useMutation } from '@apollo/client';
import { useSessionStore } from '@/lib/store/dashboard';
import StoreSummary from './StoreSummary';
import RestaurantSummary from './RestaurantSummary';
import ServicesSummary from './ServicesSummary';
import Image from 'next/image';
import AdressAutocomplete from './AdressAutocomplete';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import Link from 'next/link';
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
  buttonColor: string;
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
  businessCategory?: 'products' | 'restaurant' | 'services';
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
  options: ['Productos', 'Restaurante', 'Servicios'],
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
    text: '� Elige el color de los botones de tu tienda:',
    field: 'buttonColor',
    type: 'color' as const,
    validation: { type: 'text' as const, required: false },
    optional: true,
  },
  {
    text: '�📱 ¿Cuál es tu número de celular?',
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
    text: '� Elige el color de los botones de tu restaurante:',
    field: 'buttonColor',
    type: 'color' as const,
    validation: { type: 'text' as const, required: false },
    optional: true,
  },
  {
    text: '�📱 ¿Cuál es el teléfono de contacto?',
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
    text: '� Elige el color de los botones de tu empresa:',
    field: 'buttonColor',
    type: 'color' as const,
    validation: { type: 'text' as const, required: false },
    optional: true,
  },
  {
    text: '�📱 ¿Cuál es el teléfono de contacto?',
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
  buttonColor: '#3B82F6',
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
// @ts-ignore - suppress unused parameter-name warning in the function type annotation
function ColorPicker({ value, onChange }: { value: string; onChange: (_color: string) => void }) {
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
  onSelect: (_value: string) => void;
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
      return (
        specialtiesMap[type] || [
          'Especialidad del Día',
          'Menú Ejecutivo',
          'Plato Típico',
          'Bebidas',
          'Postres',
        ]
      );
    } else if (category === 'services') {
      const specialtiesMap: { [key: string]: string[] } = {
        Terapia: [
          'Psicología',
          'Terapia Familiar',
          'Terapia de Pareja',
          'Coaching Emocional',
          'Manejo de Estrés',
          'Orientación Vocacional',
        ],

        'Salón de Belleza': [
          'Corte de Cabello',
          'Peinados',
          'Manicure',
          'Pedicure',
          'Maquillaje',
          'Coloración',
          'Tratamientos Capilares',
        ],

        Consultor: [
          'Consultoría Empresarial',
          'Consultoría Financiera',
          'Consultoría Tecnológica',
          'Estrategia de Negocios',
          'Optimización de Procesos',
          'Asesoría Personalizada',
        ],

        Entrenador: [
          'Entrenamiento Personal',
          'Entrenamiento Funcional',
          'Fitness',
          'Entrenador Online',
          'Plan de Rutinas',
          'Acondicionamiento Físico',
        ],

        'Servicio de Limpieza': [
          'Limpieza Residencial',
          'Limpieza Comercial',
          'Limpieza Profunda',
          'Post-construcción',
          'Oficinas',
          'Desinfección',
        ],

        'Servicio de Reparación': [
          'Electrodomésticos',
          'Reparaciones del Hogar',
          'Mantenimiento General',
          'Plomería Básica',
          'Electricidad Básica',
          'Emergencias',
        ],

        Fotografía: [
          'Fotografía de Eventos',
          'Fotografía Profesional',
          'Fotografía de Productos',
          'Fotografía Corporativa',
          'Edición de Fotos',
          'Sesiones Personales',
        ],

        'Planificación de Eventos': [
          'Bodas',
          'Cumpleaños',
          'Eventos Corporativos',
          'Decoración',
          'Logística',
          'Coordinación del Evento',
        ],

        'Servicio Legal': [
          'Asesoría Legal',
          'Derecho Civil',
          'Derecho Laboral',
          'Contratos',
          'Trámites Legales',
          'Consultas Jurídicas',
        ],

        Contabilidad: [
          'Contabilidad General',
          'Declaración de Impuestos',
          'Asesoría Tributaria',
          'Facturación',
          'Estados Financieros',
          'Nómina',
        ],

        Marketing: [
          'Marketing Digital',
          'Redes Sociales',
          'Publicidad Online',
          'SEO',
          'Branding',
          'Estrategia de Contenidos',
        ],
      };

      return (
        specialtiesMap[type] || ['Consultoría General', 'Soporte Técnico', 'Asesoría Personalizada']
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
      let businessCategory: 'products' | 'restaurant' | 'services';
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

  // eslint-disable-next-line no-unused-vars
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
  // Accent color per business type
  const accent =
    storeData.businessCategory === 'restaurant'
      ? '#00B077'
      : storeData.businessCategory === 'services'
        ? '#00B2FF'
        : '#F04E23';

  const avatarState: AvatarState = createdStoreId
    ? 'happy'
    : isTyping
      ? 'thinking'
      : messages.length > 0 && messages[messages.length - 1]?.from === 'user'
        ? 'talking'
        : 'idle';

  return (
    <div
      className={`${barlowCondensed.variable} ${outfit.variable} min-h-screen flex flex-col`}
      style={{ fontFamily: 'var(--font-outfit)', background: '#0B0C11' }}
    >
      {/* Ambient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${accent}14 0%, transparent 70%)`,
        }}
      />

      {/* Progress hairline at very top */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-white/5 z-50">
        <motion.div
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Centered column */}
      <div className="relative z-10 flex-1 flex flex-col items-center w-full px-4 pt-10 pb-6">
        <div className="w-full max-w-2xl flex flex-col flex-1">
          {/* Luna avatar + label */}
          <motion.div
            className="flex flex-col items-center mb-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <AvatarLuna state={avatarState} accent={accent} />
            <div className="mt-3 flex flex-col items-center gap-1">
              <span
                className="text-xl font-bold tracking-wide"
                style={{ fontFamily: 'var(--font-barlow)', color: accent }}
              >
                Luna
              </span>
              <span className="text-xs text-white/40 tracking-widest uppercase">
                Asistente · EmprendYup
              </span>
            </div>
          </motion.div>

          {/* Step progress pills */}
          {questions.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 mb-5">
              {questions.map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-full"
                  style={{
                    height: 4,
                    width: i === currentStep ? 24 : 8,
                    background:
                      i < currentStep
                        ? accent
                        : i === currentStep
                          ? accent
                          : 'rgba(255,255,255,0.12)',
                  }}
                  animate={{ width: i === currentStep ? 24 : 8 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          )}

          {/* Chat card */}
          <div
            className="flex-1 flex flex-col rounded-2xl overflow-hidden"
            style={{ background: '#13151F', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Messages */}
            <div
              ref={chatRef}
              className="flex-1 overflow-y-auto p-5 space-y-4"
              style={{ minHeight: 320, maxHeight: '45vh' }}
            >
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.03 * Math.min(idx, 6) }}
                    className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2.5`}
                  >
                    {/* Bot micro-avatar */}
                    {msg.from === 'bot' && (
                      <div
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: `${accent}22`,
                          border: `1px solid ${accent}44`,
                          color: accent,
                        }}
                      >
                        L
                      </div>
                    )}

                    <div
                      className="max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                      style={
                        msg.from === 'bot'
                          ? {
                              background: 'rgba(255,255,255,0.05)',
                              border: `1px solid ${accent}22`,
                              color: '#e2e8f0',
                              borderBottomLeftRadius: 4,
                            }
                          : { background: accent, color: '#fff', borderBottomRightRadius: 4 }
                      }
                    >
                      {msg.from === 'bot' && msg.field && (
                        <div className="flex items-center gap-1.5 mb-1.5 opacity-50">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: accent }}
                          />
                          <span
                            className="text-[10px] uppercase tracking-wider"
                            style={{ color: accent }}
                          >
                            Luna
                          </span>
                        </div>
                      )}
                      {/* Business type options styled as cards */}
                      {((msg.field === 'businessCategory' && !selectedBusinessType) ||
                        (questions.length > 0 &&
                          currentStep < questions.length &&
                          msg === messages[messages.length - 1] &&
                          questions[currentStep]?.type === 'select' &&
                          questions[currentStep]?.options)) &&
                      msg.options ? (
                        <div className="space-y-1 mt-2">
                          <p className="mb-3 text-white/80">{msg.text}</p>
                          {msg.field === 'businessCategory' ? (
                            <div className="space-y-2">
                              {[
                                {
                                  label: 'Productos',
                                  icon: ShoppingBag,
                                  color: '#F04E23',
                                  desc: 'Tienda online de productos físicos o digitales',
                                },
                                {
                                  label: 'Restaurante',
                                  icon: UtensilsCrossed,
                                  color: '#00B077',
                                  desc: 'Menú digital, pedidos y delivery',
                                },
                                {
                                  label: 'Servicios',
                                  icon: Briefcase,
                                  color: '#00B2FF',
                                  desc: 'Agenda, cotizaciones y portafolio',
                                },
                              ].map(({ label, icon: Icon, color, desc }) => (
                                <button
                                  key={label}
                                  onClick={() => handleResponse(label)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left group transition-all duration-200 hover:scale-[1.02]"
                                  style={{
                                    background: `${color}11`,
                                    border: `1px solid ${color}33`,
                                  }}
                                >
                                  <div
                                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${color}22` }}
                                  >
                                    <Icon className="w-4 h-4" style={{ color }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white text-sm">{label}</div>
                                    <div className="text-xs text-white/40 truncate">{desc}</div>
                                  </div>
                                  <ChevronRight
                                    className="w-4 h-4 opacity-30 group-hover:opacity-80 transition-opacity"
                                    style={{ color }}
                                  />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {msg.options.map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() => handleResponse(opt)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                                  style={{
                                    background: `${accent}22`,
                                    border: `1px solid ${accent}44`,
                                    color: accent,
                                  }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        renderMessageContent(msg)
                      )}
                    </div>

                    {/* User avatar */}
                    {msg.from === 'user' && (
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold bg-white/10 text-white/60">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-2.5 justify-start"
                >
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: `${accent}22`,
                      border: `1px solid ${accent}44`,
                      color: accent,
                    }}
                  >
                    L
                  </div>
                  <div
                    className="px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.05)', borderBottomLeftRadius: 4 }}
                  >
                    <div className="flex items-end gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 rounded-full"
                          style={{ background: accent }}
                          animate={{ height: [4, 10, 4], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Description edit */}
            {showDescriptionEdit && tempDescription && (
              <div
                className="px-5 py-4 border-t"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✨</span>
                    <label className="text-sm font-medium" style={{ color: accent }}>
                      Descripción generada por IA
                    </label>
                  </div>
                  <div className="relative">
                    <textarea
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl resize-none transition-all duration-200 text-sm"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${accent}33`,
                        color: '#e2e8f0',
                        outline: 'none',
                      }}
                      placeholder="Edita la descripción aquí..."
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-white/30">
                      {tempDescription.length} caracteres
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-white/30 flex items-center gap-1">
                      <span>💡</span>
                      Puedes modificar el texto antes de continuar
                    </p>
                    <button
                      onClick={() => {
                        setStoreData((prev) => ({ ...prev, description: tempDescription }));
                        setShowDescriptionEdit(false);
                        setMessages((prev) => [
                          ...prev,
                          { from: 'user', text: `📝 ${tempDescription}`, type: 'text' },
                        ]);
                        setTempDescription('');
                        if (currentStep + 1 < questions.length) {
                          setCurrentStep((prev) => prev + 1);
                          addBotMessage(currentStep + 1);
                        } else {
                          setCurrentStep(questions.length);
                        }
                      }}
                      className="px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:scale-105 flex items-center gap-1"
                      style={{ background: accent, color: '#fff' }}
                    >
                      ✅ Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Specialties Selector */}
            {showSpecialtiesSelector && (
              <div className="px-5 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="max-w-2xl mx-auto">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <span>✨</span> Selecciona tus especialidades
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      Elige al menos 3 para generar una mejor descripción
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
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
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.03]"
                        style={
                          selectedSpecialties.includes(specialty)
                            ? { background: accent, color: '#fff' }
                            : {
                                background: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.6)',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }
                        }
                      >
                        {selectedSpecialties.includes(specialty) && <span className="mr-1">✓</span>}
                        {specialty}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-white/30">
                      {selectedSpecialties.length} seleccionada
                      {selectedSpecialties.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowSpecialtiesSelector(false);
                          setSelectedSpecialties([]);
                          if (currentStep + 1 < questions.length) {
                            setCurrentStep((prev) => prev + 1);
                            addBotMessage(currentStep + 1);
                          }
                        }}
                        className="px-3 py-2 text-xs font-medium rounded-lg transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.5)',
                        }}
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
                            if (!storeData.city || String(storeData.city).trim() === '') {
                              // Require explicit city selection before sending payload
                              alert('Por favor selecciona la ciudad antes de continuar.');
                              return;
                            }
                            setIsTyping(true);
                            const requestBody = {
                              name: storeData.name,
                              type: isRestaurant ? 'restaurant' : 'service',
                              category: isRestaurant
                                ? storeData.cuisineType
                                : storeData.businessType,
                              city: String(storeData.city).trim(),
                              specialties: selectedSpecialties,
                              tone: isRestaurant ? 'elegant' : 'professional',
                              language: 'es',
                            };

                            const apiUrl =
                              process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

                            const response = await fetch(`${apiUrl}/ai/description/generate`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify(requestBody),
                            });

                            // 200 OK o 201 Created son válidos
                            if (response.ok || response.status === 201) {
                              const result = await response.json();
                              if (result.data.description) {
                                setTempDescription(result.data.description);
                                setIsTyping(false);
                                setShowDescriptionEdit(true);
                              } else {
                                console.warn(
                                  '⚠️ No se encontró description en la respuesta:',
                                  result
                                );
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
                        className="px-5 py-2 text-xs font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-2"
                        style={{ background: accent, color: '#fff' }}
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
            {!showDescriptionEdit &&
              !showSpecialtiesSelector &&
              ((questions.length > 0 && currentStep < questions.length) ||
                (questions.length === 0 && !selectedBusinessType)) &&
              messages.length > 0 &&
              messages[messages.length - 1]?.from === 'bot' &&
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
                <div
                  className="px-5 py-4 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                      style={{
                        background: '#ff000018',
                        border: '1px solid #ff444433',
                        color: '#ff9999',
                      }}
                    >
                      <span>⚠️</span>
                      {validationError}
                      {questions.length > 0 && questions[currentStep]?.validation?.message && (
                        <span className="opacity-70">
                          {' '}
                          — {questions[currentStep]?.validation?.message}
                        </span>
                      )}
                    </motion.div>
                  )}

                  <div className="flex gap-2">
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
                          ? `${questions[currentStep]?.text.split('?')[0]}...`
                          : 'Escribe tu respuesta...'
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${validationError ? '#ff4444' : `${accent}44`}`,
                        color: '#e2e8f0',
                      }}
                    />
                    <div className="flex gap-1.5">
                      {questions.length > 0 && questions[currentStep]?.optional && (
                        <button
                          onClick={handleSkip}
                          className="px-3 py-2.5 rounded-xl text-xs transition-all hover:scale-105"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.5)',
                          }}
                          title="Saltar pregunta opcional"
                        >
                          Saltar
                        </button>
                      )}
                      <button
                        onClick={handleSend}
                        disabled={
                          !input.trim() && questions.length > 0 && !questions[currentStep]?.optional
                        }
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-40 flex items-center gap-1.5"
                        style={{ background: accent, color: '#fff' }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Enviar
                      </button>
                    </div>
                  </div>
                  {questions.length > 0 && questions[currentStep]?.optional && (
                    <p className="text-[10px] text-white/25 mt-2">
                      💡 Pregunta opcional — puedes saltarla
                    </p>
                  )}
                </div>
              )}

            {questions.length > 0 && currentStep >= questions.length && (
              <div className="px-5 py-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {createdStoreId ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4 py-4"
                  >
                    <motion.div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                      style={{ background: `${accent}22`, border: `2px solid ${accent}` }}
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 0.6, repeat: 3 }}
                    >
                      <span className="text-2xl">✓</span>
                    </motion.div>
                    <h2
                      className="text-xl font-bold text-white"
                      style={{ fontFamily: 'var(--font-barlow)' }}
                    >
                      {storeData.businessCategory === 'restaurant'
                        ? '¡Tu restaurante ha sido creado!'
                        : storeData.businessCategory === 'services'
                          ? '¡Tu empresa de servicios ha sido creada!'
                          : '¡Tu tienda ha sido creada!'}
                    </h2>
                    <p className="text-sm text-white/40">
                      Próximamente recibirás un email con los detalles de acceso.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      {(() => {
                        // Build a friendly URL depending on the created resource type.
                        // - For stores (products), prefer `shopUrl` or subdomain: `https://{storeId}.emprendyup.com`.
                        // - For restaurants/services, prefer a path using `slug`: `https://emprendyup.com/{slug}`.
                        const category =
                          (createdStore && createdStore.businessCategory) ||
                          storeData.businessCategory;

                        // If the created resource is a restaurant or service, prefer slug paths
                        if (category === 'restaurant' || category === 'services') {
                          const slug = createdStore?.slug || createdStoreId;
                          if (slug)
                            return (
                              <a
                                href={`https://${slug}.emprendyup.com`}
                                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:scale-105"
                                style={{ background: accent, color: '#fff' }}
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
                            <div className="flex items-center gap-3">
                              <a
                                href={createdStore.shopUrl}
                                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:scale-105"
                                style={{ background: accent, color: '#fff' }}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Ir a la tienda
                              </a>
                              <Link
                                href="/"
                                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:scale-105"
                                style={{
                                  background: 'rgba(255,255,255,0.08)',
                                  color: 'rgba(255,255,255,0.7)',
                                }}
                              >
                                Ir al panel
                              </Link>
                            </div>
                          );
                        }

                        if (createdStore?.storeId) {
                          return (
                            <div className="flex items-center gap-3">
                              <a
                                href={`https://${createdStore.storeId}.emprendyup.com`}
                                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:scale-105"
                                style={{ background: accent, color: '#fff' }}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Ir a la tienda
                              </a>
                              <a
                                href="/dashboard"
                                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:scale-105"
                                style={{
                                  background: 'rgba(255,255,255,0.08)',
                                  color: 'rgba(255,255,255,0.7)',
                                }}
                              >
                                Ir al panel
                              </a>
                            </div>
                          );
                        }

                        if (createdStoreId) {
                          return (
                            <div className="flex items-center gap-3">
                              <a
                                href={`https://${createdStoreId}.emprendyup.com`}
                                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:scale-105"
                                style={{ background: accent, color: '#fff' }}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Ir a la tienda
                              </a>
                              <a
                                href="/dashboard"
                                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:scale-105"
                                style={{
                                  background: 'rgba(255,255,255,0.08)',
                                  color: 'rgba(255,255,255,0.7)',
                                }}
                              >
                                Ir al panel
                              </a>
                            </div>
                          );
                        }

                        // Fallback
                        return (
                          <div className="flex items-center gap-3">
                            <a
                              href="https://emprendyup.com"
                              className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:scale-105"
                              style={{ background: accent, color: '#fff' }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Ir a la tienda
                            </a>
                            <a
                              href="/dashboard"
                              className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:scale-105"
                              style={{
                                background: 'rgba(255,255,255,0.08)',
                                color: 'rgba(255,255,255,0.7)',
                              }}
                            >
                              Ir al panel
                            </a>
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                ) : (
                  // Botón para revisar datos antes de crear (cuando aún no se ha creado)
                  <>
                    <div className="text-center mb-4 text-slate-300">
                      <button
                        onClick={() => openSummary()}
                        className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:scale-105"
                        style={{ background: accent, color: '#fff' }}
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
                              buttonColor:
                                updatedData.buttonColor || updatedData.primaryColor || '#3B82F6',
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
                                buttonColor:
                                  updatedData.buttonColor || updatedData.primaryColor || '#3B82F6',
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
                            const { data } = await createRestaurantMutation({
                              variables: { input },
                            });
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
                              buttonColor:
                                updatedData.buttonColor || updatedData.primaryColor || '#7C3AED',
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
                                buttonColor:
                                  updatedData.buttonColor || updatedData.primaryColor || '#7C3AED',
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
                            setCreateError(
                              err?.message || 'Error al crear la empresa de servicios'
                            );
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
                            const {
                              businessCategory: _bc,
                              coverImage: _ci,
                              googleLocation: _gl,
                              ...validStoreData
                            } = updatedData;

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

                {/* Error state */}
                {createError && (
                  <div
                    className="mt-3 px-4 py-3 rounded-xl text-xs flex items-center gap-2"
                    style={{
                      background: '#ff000018',
                      border: '1px solid #ff444433',
                      color: '#ff9999',
                    }}
                  >
                    ⚠️ {createError}
                  </div>
                )}

                {/* Creating spinner */}
                {creating && (
                  <div
                    className="mt-3 px-4 py-3 rounded-xl text-xs flex items-center gap-2"
                    style={{
                      background: `${accent}11`,
                      border: `1px solid ${accent}33`,
                      color: accent,
                    }}
                  >
                    <div
                      className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: accent, borderTopColor: 'transparent' }}
                    />
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
          {/* end chat card */}
        </div>
        {/* end max-w-2xl */}
      </div>
      {/* end centered column */}
    </div>
  );
}
