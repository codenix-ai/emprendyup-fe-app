'use client';

import { useState } from 'react';
import { X, ShoppingCart, CheckCircle, Loader2 } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { CREATE_ORDER, CREATE_PAYMENT } from '@/lib/graphql/queries';

interface OrderCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderId: string, paymentId: string) => void;
  planName: string;
  planAmount: number;
  planId: string;
  billingCycle: 'monthly' | 'annual';
}

export default function OrderCreationModal({
  isOpen,
  onClose,
  onOrderCreated,
  planName,
  planAmount,
  planId,
  billingCycle,
}: OrderCreationModalProps) {
  const [step, setStep] = useState<'confirm' | 'creating' | 'success'>('confirm');
  const [orderId, setOrderId] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const [createOrderMutation] = useMutation(CREATE_ORDER);
  const [createPaymentMutation] = useMutation(CREATE_PAYMENT);

  const handleCreateOrder = async () => {
    setStep('creating');
    setError('');

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const storeId = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID;

      if (!storeId) {
        throw new Error('No se encontró información de la tienda');
      }

      // Calcular impuestos (IVA 19%)
      const taxBase = Math.round(planAmount / 1.19);
      const tax = planAmount - taxBase;
      const subtotal = taxBase;

      // Crear orden con GraphQL según el DTO
      const { data } = await createOrderMutation({
        variables: {
          input: {
            items: [
              {
                productId: planId,
                productName: `Suscripción ${planName} - ${billingCycle === 'monthly' ? 'Mensual' : 'Anual'}`,
                quantity: 1,
                unitPrice: planAmount,
              },
            ],
            shipping: 0,
            subtotal: subtotal,
            tax: tax,
            total: planAmount,
            storeId: storeId,
          },
        },
      });

      const createdOrderId = data?.createOrder?.id;

      if (!createdOrderId) {
        throw new Error('No se recibió el ID de la orden');
      }

      console.log('Orden creada exitosamente:', data.createOrder);
      setOrderId(createdOrderId);

      // Crear el pago de referencia

      const { data: paymentData } = await createPaymentMutation({
        variables: {
          input: {
            amount: planAmount,
            currency: 'COP',
            description: `Pago de suscripción ${planName} - ${billingCycle === 'monthly' ? 'Mensual' : 'Anual'}`,
            paymentType: 'PAYMENT',
            provider: 'EPAYCO',
            paymentMethod: 'ONLINE',
            externalReference: createdOrderId,
            customerEmail: user?.email || 'cliente@example.com',
            customerPhone: user?.phone || '3000000000',
            customerDocumentType: user?.documentType || 'CC',
            customerDocument: user?.document || '12345678',
            orderId: createdOrderId,
            userId: user?.id,
            storeId: storeId,
          },
        },
      });

      const createdPaymentId = paymentData?.createPayment?.id;

      if (!createdPaymentId) {
        throw new Error('No se recibió el ID del pago');
      }

      console.log('Pago creado exitosamente:', paymentData.createPayment);
      setPaymentId(createdPaymentId);
      setStep('success');

      // Esperar un momento para mostrar el éxito antes de continuar
      setTimeout(() => {
        onOrderCreated(createdOrderId, createdPaymentId);
        onClose();
        resetModal();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating order:', err);
      const errorMessage =
        err?.graphQLErrors?.[0]?.message || err?.message || 'Error al crear la orden o el pago';
      setError(errorMessage);
      setStep('confirm');
    }
  };

  const resetModal = () => {
    setStep('confirm');
    setOrderId('');
    setPaymentId('');
    setError('');
  };

  const handleClose = () => {
    if (step !== 'creating') {
      onClose();
      resetModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-fourth-base" />
            Confirmar Suscripción
          </h2>
          {step !== 'creating' && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Plan:</span>
                  <span className="text-white font-medium capitalize">{planName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Ciclo de facturación:</span>
                  <span className="text-white font-medium">
                    {billingCycle === 'monthly' ? 'Mensual' : 'Anual'}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-gray-600">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white font-bold text-lg">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                    }).format(planAmount)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <p className="text-gray-400 text-sm">
                Al confirmar, se creará una orden de pago y serás redirigido a la pasarela de pago
                segura de ePayco.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateOrder}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-fourth-base to-fourth-500 hover:from-fourth-600 hover:to-fourth-700 text-white rounded-lg transition font-medium"
                >
                  Continuar al pago
                </button>
              </div>
            </div>
          )}

          {step === 'creating' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-16 h-16 text-fourth-base animate-spin" />
              <p className="text-white font-medium">Creando orden de pago...</p>
              <p className="text-gray-400 text-sm">Por favor espera un momento</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <p className="text-white font-medium">¡Orden creada exitosamente!</p>
              <p className="text-gray-400 text-sm">Redirigiendo al pago...</p>
              {orderId && (
                <p className="text-xs text-gray-500 font-mono">
                  Orden: {orderId.substring(0, 8)}...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
