'use client';
import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import Image from 'next/image';
import { useSessionStore } from '@/lib/store/dashboard';

interface StoreSummaryProps {
  open: boolean;
  onClose: () => void;
  data: any;
  onConfirm: (values: any) => void;
}

export default function StoreSummary({ open, onClose, data, onConfirm }: StoreSummaryProps) {
  const [formData, setFormData] = useState<any>(data || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useSessionStore();

  // Resolve stored keys to full URLs and allow blob/data/http(s) to pass through
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

  // Actualiza el formulario cuando cambian los datos iniciales
  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // If the user changes the store name, try to auto-update storeId
    if (name === 'name') {
      setFormData((prev: any) => {
        const prevName = (prev.name || '').trim().toLowerCase();
        const normalizedPrev = prevName.replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
        const normalizedNew = value
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        const shouldUpdateStoreId = !prev.storeId || prev.storeId === normalizedPrev;
        return {
          ...prev,
          name: value,
          storeId: shouldUpdateStoreId ? normalizedNew : prev.storeId,
        };
      });
      return;
    }

    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Función para manejar la subida de logo (igual que en el chat)
  const handleLogoUpload = (logoUrl: string) => {
    setFormData((prev: any) => ({ ...prev, logoUrl }));
  };

  // Función para eliminar logo
  const handleRemoveLogo = () => {
    setFormData((prev: any) => ({ ...prev, logoUrl: '' }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(formData);
    } catch (error) {
      console.error('Error al crear tienda:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Estilos compartidos para inputs
  const inputClassName =
    'w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 m-4 border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-6">
          <h2 className="text-xl font-bold text-white">Revisar y editar datos de la tienda</h2>
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
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder="Nombre de la tienda"
              className={inputClassName}
              disabled={isSubmitting}
            />
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
          {/* Logo */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-1">
              Logo de la tienda
            </h3>

            <div className="space-y-4">
              {!formData.logoUrl && (
                <div>
                  <FileUpload
                    onFile={handleLogoUpload}
                    accept="image/*"
                    storeId={formData.storeId}
                  />
                </div>
              )}

              {formData.logoUrl && (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    {(() => {
                      const resolved = resolveImageUrl(formData.logoUrl);
                      const isBlob = resolved.startsWith('blob:') || resolved.startsWith('data:');
                      return (
                        <Image
                          src={resolved}
                          alt="Logo preview"
                          width={80}
                          height={80}
                          className="h-20 w-20 object-contain rounded-lg border border-gray-600"
                          unoptimized={isBlob}
                        />
                      );
                    })()}
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs flex items-center justify-center transition-colors"
                      disabled={isSubmitting}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colores */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-1">
              Colores de la tienda
            </h3>
            <div className="flex gap-4 items-center">
              <div className="flex flex-col items-center">
                <label className="text-sm font-medium text-gray-300 mb-1">Primario</label>
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor || '#000000'}
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
                  value={formData.secondaryColor || '#000000'}
                  onChange={handleChange}
                  className="w-12 h-12 border border-gray-600 rounded cursor-pointer bg-gray-800"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col items-center">
                <label className="text-sm font-medium text-gray-300 mb-1">Botones</label>
                <input
                  type="color"
                  name="buttonColor"
                  value={formData.buttonColor || formData.primaryColor || '#3B82F6'}
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
                  value={formData.accentColor || '#000000'}
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
              <input
                type="email"
                name="email"
                value={user.user?.email || formData.email || ''}
                onChange={handleChange}
                placeholder="Email"
                className={inputClassName}
                disabled={isSubmitting}
              />
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
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              placeholder="Dirección"
              className={inputClassName}
              disabled={isSubmitting}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                placeholder="Ciudad"
                className={inputClassName}
                disabled={isSubmitting}
              />
              <input
                type="text"
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
                placeholder="País"
                className={inputClassName}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Información legal */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-1">
              Información legal
            </h3>
            <input
              type="text"
              name="businessType"
              value={formData.businessType || ''}
              onChange={handleChange}
              placeholder="Tipo de negocio"
              className={inputClassName}
              disabled={isSubmitting}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                name="taxId"
                value={formData.taxId || ''}
                onChange={handleChange}
                placeholder="NIT"
                className={inputClassName}
                disabled={isSubmitting}
              />
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

          {/* Redes sociales */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-1">
              Redes sociales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="url"
                name="facebookUrl"
                value={formData.facebookUrl || ''}
                onChange={handleChange}
                placeholder="Facebook URL"
                className={inputClassName}
                disabled={isSubmitting}
              />
              <input
                type="url"
                name="instagramUrl"
                value={formData.instagramUrl || ''}
                onChange={handleChange}
                placeholder="Instagram URL"
                className={inputClassName}
                disabled={isSubmitting}
              />
              <input
                type="url"
                name="twitterUrl"
                value={formData.twitterUrl || ''}
                onChange={handleChange}
                placeholder="Twitter URL"
                className={inputClassName}
                disabled={isSubmitting}
              />
              <input
                type="url"
                name="youtubeUrl"
                value={formData.youtubeUrl || ''}
                onChange={handleChange}
                placeholder="YouTube URL"
                className={inputClassName}
                disabled={isSubmitting}
              />
              <input
                type="url"
                name="tiktokUrl"
                value={formData.tiktokUrl || ''}
                onChange={handleChange}
                placeholder="TikTok URL"
                className={inputClassName}
                disabled={isSubmitting}
              />
              <input
                type="text"
                name="whatsappNumber"
                value={formData.whatsappNumber || ''}
                onChange={handleChange}
                placeholder="WhatsApp (ej: 3124567890)"
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
              'Crear tienda'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
