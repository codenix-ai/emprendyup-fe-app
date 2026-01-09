'use client';
import React, { useState, useEffect, useRef } from 'react';
import FileUpload from './FileUpload';
import Image from 'next/image';
import { useSessionStore } from '@/lib/store/dashboard';
import AdressAutocomplete from './AdressAutocomplete';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface RestaurantSummaryProps {
  open: boolean;
  onClose: () => void;
  data: any;
  onConfirm: (values: any) => void;
}

export default function RestaurantSummary({
  open,
  onClose,
  data,
  onConfirm,
}: RestaurantSummaryProps) {
  const [formData, setFormData] = useState<any>(data || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useSessionStore();

  const resolveImageUrl = (value?: string) => {
    if (!value) return '';
    if (
      value.startsWith('http') ||
      value.startsWith('https') ||
      value.startsWith('blob:') ||
      value.startsWith('data:')
    ) {
      return value;
    }
    return `https://emprendyup-images.s3.us-east-1.amazonaws.com/${value}`;
  };

  useEffect(() => {
    if (data) {
      setFormData({
        ...data,
        whatsappNumber: data.whatsappNumber || data.phone || '',
        email: data.email || user.user?.email || '',
      });
    }
  }, [data, user.user?.email]);

  // Google Maps refs and init
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

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

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (field: string) => (url: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: url }));
  };

  const handleRemoveImage = (field: string) => () => {
    setFormData((prev: any) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(formData);
    } catch (error) {
      console.error('Error al crear restaurante:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const inputClassName =
    'w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  const ImageUploadSection = ({ field, label }: { field: string; label: string }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300 block mb-2">{label}</label>
      {!formData[field] ? (
        <FileUpload onFile={handleImageUpload(field)} accept="image/*" storeId={formData.storeId} />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="relative inline-block">
            {(() => {
              const resolved = resolveImageUrl(formData[field]);
              const isBlob = resolved.startsWith('blob:') || resolved.startsWith('data:');
              return (
                <Image
                  src={resolved}
                  alt={`${label} preview`}
                  width={80}
                  height={80}
                  className="h-20 w-20 object-contain rounded-lg border border-gray-600"
                  unoptimized={isBlob}
                />
              );
            })()}
            <button
              type="button"
              onClick={handleRemoveImage(field)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs flex items-center justify-center transition-colors"
              disabled={isSubmitting}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 m-4 border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-6">
          <h2 className="text-xl font-bold text-white">🍽️ Revisar datos del restaurante</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-1">
              Información básica
            </h3>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Nombre del restaurante
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="Nombre del restaurante"
                className={inputClassName}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Tipo de cocina</label>
              <input
                type="text"
                name="cuisineType"
                value={formData.cuisineType || ''}
                onChange={handleChange}
                placeholder="Tipo de cocina"
                className={inputClassName}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Descripción</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="Descripción"
                rows={3}
                className={`${inputClassName} resize-none`}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-1">
              Ubicación
            </h3>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Ciudad</label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                placeholder="Ciudad"
                className={inputClassName}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Dirección completa
              </label>
              <AdressAutocomplete
                onPlaceSelected={async (place) => {
                  if (!place || !place.geometry || !place.geometry.location) return;
                  const lat = place.geometry.location.lat();
                  const lng = place.geometry.location.lng();

                  setFormData((prev: any) => ({
                    ...prev,
                    address: place.formatted_address || '',
                    lat,
                    lng,
                    googleLocation: place.url || prev.googleLocation,
                  }));

                  // center map and add marker
                  if (!mapRef.current) {
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
                      const markerLib = (await importLibrary(
                        'marker'
                      )) as google.maps.MarkerLibrary;
                      if (!markerRef.current) {
                        markerRef.current = new markerLib.AdvancedMarkerElement({
                          map: mapRef.current,
                          position: { lat, lng },
                        });
                      } else {
                        markerRef.current.position = { lat, lng };
                      }
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.warn('Marker library not available or error creating marker', err);
                    }
                  }
                }}
              />

              <div className="mt-3 rounded-md overflow-hidden">
                <div ref={setMapRef} style={{ height: 300 }} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Departamento (opcional)
              </label>
              <input
                type="text"
                name="department"
                value={formData.department || ''}
                onChange={handleChange}
                placeholder="Departamento"
                className={inputClassName}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Google Maps (opcional)
              </label>
              <input
                type="url"
                name="googleLocation"
                value={formData.googleLocation || ''}
                onChange={handleChange}
                placeholder="Enlace de Google Maps"
                className={inputClassName}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Imágenes */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-1">
              Imágenes
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadSection field="logoUrl" label="Logo" />
              <ImageUploadSection field="faviconUrl" label="Favicon" />
              <ImageUploadSection field="bannerUrl" label="Banner" />
              <ImageUploadSection field="coverImage" label="Portada" />
            </div>
          </div>

          {/* Colores */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-1">
              Colores del restaurante
            </h3>
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex flex-col items-center">
                <label className="text-sm font-medium text-gray-300 mb-1">Primario</label>
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor || '#3B82F6'}
                  onChange={handleChange}
                  className="w-12 h-12 border border-gray-600 rounded cursor-pointer bg-gray-800"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col items-center">
                <label className="text-sm font-medium text-gray-300 mb-1">Secundario</label>
                <input
                  type="color"
                  name="secondaryColor"
                  value={formData.secondaryColor || '#1F2937'}
                  onChange={handleChange}
                  className="w-12 h-12 border border-gray-600 rounded cursor-pointer bg-gray-800"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col items-center">
                <label className="text-sm font-medium text-gray-300 mb-1">Acento</label>
                <input
                  type="color"
                  name="accentColor"
                  value={formData.accentColor || '#10B981'}
                  onChange={handleChange}
                  className="w-12 h-12 border border-gray-600 rounded cursor-pointer bg-gray-800"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col items-center">
                <label className="text-sm font-medium text-gray-300 mb-1">Texto</label>
                <input
                  type="color"
                  name="textColor"
                  value={formData.textColor || '#111827'}
                  onChange={handleChange}
                  className="w-12 h-12 border border-gray-600 rounded cursor-pointer bg-gray-800"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-1">
              Información de contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  placeholder="Teléfono"
                  className={inputClassName}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">
                  WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  name="whatsappNumber"
                  value={formData.whatsappNumber || ''}
                  onChange={handleChange}
                  placeholder="WhatsApp"
                  className={inputClassName}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Email (opcional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="Email"
                className={inputClassName}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Redes sociales */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-1">
              Redes sociales (opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Facebook</label>
                <input
                  type="url"
                  name="facebookUrl"
                  value={formData.facebookUrl || ''}
                  onChange={handleChange}
                  placeholder="Facebook URL"
                  className={inputClassName}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Instagram</label>
                <input
                  type="url"
                  name="instagramUrl"
                  value={formData.instagramUrl || ''}
                  onChange={handleChange}
                  placeholder="Instagram URL"
                  className={inputClassName}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Twitter</label>
                <input
                  type="url"
                  name="twitterUrl"
                  value={formData.twitterUrl || ''}
                  onChange={handleChange}
                  placeholder="Twitter URL"
                  className={inputClassName}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Información legal */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-1">
              Información legal (opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">NIT/RUT</label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId || ''}
                  onChange={handleChange}
                  placeholder="NIT/RUT"
                  className={inputClassName}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Razón social</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName || ''}
                  onChange={handleChange}
                  placeholder="Razón social"
                  className={inputClassName}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Tipo de negocio
              </label>
              <input
                type="text"
                name="businessType"
                value={formData.businessType || ''}
                onChange={handleChange}
                placeholder="Tipo de negocio"
                className={inputClassName}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors font-medium"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creando...
              </>
            ) : (
              'Crear restaurante'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
