'use client';

import { useState, useEffect } from 'react';
import { X, Package, Loader2 } from 'lucide-react';
import { useMutation, gql } from '@apollo/client';
import toast from 'react-hot-toast';
import {
  Shipment,
  CreateShipmentInput,
  UpdateShipmentInput,
  ShipmentStatus,
} from '@/app/utils/types/types';

interface ShipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  shipment?: Shipment | null;
  onSuccess: () => void;
}

const CREATE_SHIPMENT = gql`
  mutation CreateShipment($input: CreateShipmentInput!) {
    createShipment(input: $input) {
      id
      orderId
      provider
      trackingNumber
      shippingCost
      totalWeight
      shippedAt
      estimatedDeliveryAt
      status
      trackingUrl
      notes
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_SHIPMENT = gql`
  mutation UpdateShipment($orderId: ID!, $input: UpdateShipmentInput!) {
    updateShipment(orderId: $orderId, input: $input) {
      id
      orderId
      provider
      trackingNumber
      shippingCost
      totalWeight
      shippedAt
      estimatedDeliveryAt
      status
      trackingUrl
      notes
      createdAt
      updatedAt
    }
  }
`;

const ESTADOS: { value: ShipmentStatus; label: string }[] = [
  { value: 'PENDIENTE_RECOLECCION', label: 'Pendiente de recolección' },
  { value: 'RECOLECTADO', label: 'Recolectado' },
  { value: 'EN_TRANSITO', label: 'En tránsito' },
  { value: 'EN_CENTRO_DISTRIBUCION', label: 'En centro de distribución' },
  { value: 'EN_REPARTO', label: 'En reparto' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'NO_ENTREGADO', label: 'No entregado' },
  { value: 'DEVUELTO', label: 'Devuelto' },
];

export default function ShipmentFormModal({
  isOpen,
  onClose,
  orderId,
  shipment,
  onSuccess,
}: ShipmentFormModalProps) {
  const isEditing = !!shipment;

  const [createShipment, { loading: creating }] = useMutation(CREATE_SHIPMENT);
  const [updateShipment, { loading: updating }] = useMutation(UPDATE_SHIPMENT);

  const isLoading = creating || updating;

  // Form state
  const [formData, setFormData] = useState({
    provider: '',
    trackingNumber: '',
    shippingCost: '',
    totalWeight: '',
    shippedAt: '',
    estimatedDeliveryAt: '',
    deliveredAt: '',
    status: 'PENDIENTE_RECOLECCION' as ShipmentStatus,
    trackingUrl: '',
    notes: '',
  });

  // Load shipment data when editing
  useEffect(() => {
    if (shipment) {
      setFormData({
        provider: shipment.provider,
        trackingNumber: shipment.trackingNumber,
        shippingCost: shipment.shippingCost.toString(),
        totalWeight: shipment.totalWeight.toString(),
        shippedAt: shipment.shippedAt.split('T')[0],
        estimatedDeliveryAt: shipment.estimatedDeliveryAt.split('T')[0],
        deliveredAt: shipment.deliveredAt ? shipment.deliveredAt.split('T')[0] : '',
        status: shipment.status,
        trackingUrl: shipment.trackingUrl || '',
        notes: shipment.notes || '',
      });
    }
  }, [shipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && shipment) {
        // Update existing shipment
        const updateData: UpdateShipmentInput = {
          provider: formData.provider,
          trackingNumber: formData.trackingNumber,
          shippingCost: parseFloat(formData.shippingCost),
          totalWeight: parseFloat(formData.totalWeight),
          shippedAt: `${formData.shippedAt}T00:00:00Z`,
          estimatedDeliveryAt: `${formData.estimatedDeliveryAt}T00:00:00Z`,
          status: formData.status,
          trackingUrl: formData.trackingUrl || undefined,
          notes: formData.notes || undefined,
        };

        await updateShipment({
          variables: {
            orderId: shipment.orderId,
            input: updateData,
          },
        });

        toast.success('Envío actualizado exitosamente');
      } else {
        // Create new shipment
        const createData: CreateShipmentInput = {
          orderId: orderId,
          provider: formData.provider,
          trackingNumber: formData.trackingNumber,
          shippingCost: parseFloat(formData.shippingCost),
          totalWeight: parseFloat(formData.totalWeight),
          shippedAt: `${formData.shippedAt}T00:00:00Z`,
          estimatedDeliveryAt: `${formData.estimatedDeliveryAt}T00:00:00Z`,
          status: formData.status,
          trackingUrl: formData.trackingUrl || undefined,
          notes: formData.notes || undefined,
        };

        await createShipment({
          variables: {
            input: createData,
          },
        });

        toast.success('Envío creado exitosamente');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al guardar envío:', error);
      toast.error('Error al guardar envío');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-xl shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-fourth-base p-6 text-black">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 hover:bg-black/10 transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">{isEditing ? 'Editar Envío' : 'Crear Envío'}</h2>
              <p className="text-gray-800 text-sm mt-1">
                {isEditing
                  ? 'Actualiza la información del envío'
                  : 'Registra la información del envío del pedido'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Proveedor de Envío <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
              placeholder="Servientrega, Coordinadora, etc."
              required
            />
          </div>

          {/* Grid for two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Número de Guía */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Número de Guía <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.trackingNumber}
                onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                placeholder="123456789"
                required
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Estado del Envío <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ShipmentStatus })
                }
                className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                required
              >
                {ESTADOS.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Costo */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Costo de Envío (COP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.shippingCost}
                onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                placeholder="15000"
                required
              />
            </div>

            {/* Peso */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Peso Total (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.totalWeight}
                onChange={(e) => setFormData({ ...formData, totalWeight: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                placeholder="2.5"
                required
              />
            </div>

            {/* Fecha Despacho */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Fecha de Despacho <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.shippedAt}
                onChange={(e) => setFormData({ ...formData, shippedAt: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                required
              />
            </div>

            {/* Fecha Entrega Estimada */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Fecha Entrega Estimada <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.estimatedDeliveryAt}
                onChange={(e) => setFormData({ ...formData, estimatedDeliveryAt: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* URL Seguimiento */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">URL de Seguimiento</label>
            <input
              type="url"
              value={formData.trackingUrl}
              onChange={(e) => setFormData({ ...formData, trackingUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
              placeholder="https://seguimiento.com/123456"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Notas del Envío</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent resize-none"
              placeholder="Instrucciones especiales, horarios de entrega, etc."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors text-white"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-fourth-base text-black rounded-lg hover:bg-fourth-base/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>{isEditing ? 'Actualizar' : 'Crear'} Envío</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
