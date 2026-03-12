'use client';
import React, { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@apollo/client';

import {
  CheckCircle,
  Package,
  Truck,
  CreditCard,
  MapPin,
  AlertCircle,
  XCircle,
  RefreshCw,
  Loader,
} from 'lucide-react';
import { GET_PAYMENT, UPDATE_ORDER } from '@/lib/graphql/queries';
import { useMutation, gql } from '@apollo/client';
import Link from 'next/link';
import { WompiTransactionData, WompiTransactionResponse } from '@/app/types/wompi';
import { usePayments } from '@/lib/hooks/usePayments';
import { PaymentStatus } from '@/app/utils/types/payment';

interface PaymentValidationProps {
  paymentId: string;
}

export default function PaymentValidation({ paymentId }: PaymentValidationProps) {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('id');
  const [polling, setPolling] = useState(true);
  const [wompiTransaction, setWompiTransaction] = useState<WompiTransactionData | null>(null);
  const [wompiLoading, setWompiLoading] = useState(false);
  const [wompiError, setWompiError] = useState<string | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // Use the payments hook for GraphQL operations
  const { updatePayment: handleUpdatePaymentMutation } = usePayments();

  // Order status update mutation
  const [updateOrderStatusMutation] = useMutation(UPDATE_ORDER, {
    errorPolicy: 'all',
  });

  const { data, loading, error, refetch } = useQuery(GET_PAYMENT, {
    variables: { id: paymentId },
    pollInterval: polling ? 3000 : 0, // Poll every 3 seconds while pending
    errorPolicy: 'all',
  });

  const payment = data?.payment;

  // Function to update payment in database with Wompi data
  const handleUpdatePayment = async (wompiData: WompiTransactionData) => {
    try {
      setUpdatingPayment(true);

      // Map Wompi status to PaymentStatus enum
      const mappedStatus = mapWompiStatus(wompiData.status);

      // Prepare update input for GraphQL mutation
      const updateInput = {
        status: mappedStatus,
        providerTransactionId: wompiData.id,
        referenceNumber: wompiData.reference,
        ...(mappedStatus === PaymentStatus.FAILED &&
          wompiData.status_message && {
            errorMessage: wompiData.status_message,
          }),
        notes: `Updated from Wompi transaction. Original status: ${wompiData.status}. Finalized at: ${
          wompiData.finalized_at || 'N/A'
        }`,
        providerMetadata: wompiData,
      };

      // Use GraphQL mutation to update payment
      await handleUpdatePaymentMutation(paymentId, updateInput);

      // Update order status based on payment status
      const resultUpdate = await updateOrderStatus(wompiData, mappedStatus);

      // Refetch GraphQL data to get updated payment info
      if (refetch) {
        await refetch();
      }

      return true;
    } catch (error) {
      console.error('Error updating payment via GraphQL:', error);
      return false;
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Function to update order status based on payment result
  const updateOrderStatus = async (
    wompiData: WompiTransactionData,
    paymentStatus: PaymentStatus
  ) => {
    try {
      let orderStatus = 'PENDING';

      // Map payment status to order status
      switch (paymentStatus) {
        case PaymentStatus.COMPLETED:
          orderStatus = 'CONFIRMED';
          break;
        case PaymentStatus.FAILED:
          orderStatus = 'PAYMENT_FAILED';
          break;
        case PaymentStatus.CANCELLED:
          orderStatus = 'CANCELLED';
          break;
        default:
          orderStatus = 'PENDING';
      }

      // Get order ID from payment or use reference
      const orderId = payment?.order?.id || wompiData.reference;

      if (!orderId) {
        console.warn('No order ID found to update order status');
        return false;
      }

      // Use GraphQL mutation to update order status and financial details
      const { data } = await updateOrderStatusMutation({
        variables: {
          id: orderId,
          input: {
            status: orderStatus,
          },
        },
      });

      if (data?.updateOrderStatus) {
        return true;
      } else {
        console.error('Failed to update order via GraphQL');
        return false;
      }
    } catch (error) {
      console.error('Error updating order via GraphQL:', error);
      return false;
    }
  };

  // Function to fetch transaction from Wompi API
  const fetchWompiTransaction = async (txId: string) => {
    try {
      setWompiLoading(true);
      setWompiError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WOMPI_API_URL}/v1/transactions/${txId}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_WOMPI_PRIVATE_KEY || ''}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: WompiTransactionResponse = await response.json();

      if (result.data) {
        setWompiTransaction(result.data);

        // Update payment in database with Wompi data
        await handleUpdatePayment(result.data);

        // Stop polling if transaction is in final state
        const finalStates = ['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'];
        if (finalStates.includes(result.data.status)) {
          setPolling(false);
        }
      }
    } catch (err) {
      console.error('Error fetching Wompi transaction:', err);
      setWompiError(err instanceof Error ? err.message : 'Error fetching transaction');
    } finally {
      setWompiLoading(false);
    }
  };

  // Effect to poll Wompi transaction
  useEffect(() => {
    if (!transactionId) return;

    // Initial fetch
    fetchWompiTransaction(transactionId);

    // Set up polling interval
    let interval: NodeJS.Timeout;
    if (polling) {
      interval = setInterval(() => {
        fetchWompiTransaction(transactionId);
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [transactionId, polling]);

  // Stop polling when payment is in a final state or Wompi transaction is in final state
  useEffect(() => {
    if (
      payment?.status &&
      [PaymentStatus.COMPLETED, PaymentStatus.FAILED, PaymentStatus.CANCELLED].includes(
        payment.status
      )
    ) {
      setPolling(false);
    }

    // Also stop polling based on Wompi transaction status
    if (wompiTransaction?.status) {
      const finalStates = ['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'];
      if (finalStates.includes(wompiTransaction.status)) {
        setPolling(false);
      }
    }
  }, [payment?.status, wompiTransaction?.status]);

  // Auto-stop polling after 5 minutes
  useEffect(() => {
    const timeout = setTimeout(
      () => {
        setPolling(false);
      },
      5 * 60 * 1000
    );

    return () => clearTimeout(timeout);
  }, []);

  // Helper function to map Wompi status to display status
  const mapWompiStatus = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return PaymentStatus.COMPLETED;
      case 'DECLINED':
      case 'ERROR':
        return PaymentStatus.FAILED;
      case 'VOIDED':
        return PaymentStatus.CANCELLED;
      case 'PENDING':
      default:
        return PaymentStatus.PENDING;
    }
  };

  // Helper function to get status icon and color
  const getStatusDisplay = (status: string, isPayment: boolean = false) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    if (isPayment) {
      switch (status) {
        case PaymentStatus.COMPLETED:
          return {
            icon: <CheckCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-green-900/50 text-green-300`,
            text: 'Completado',
          };
        case PaymentStatus.FAILED:
          return {
            icon: <XCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-red-900/50 text-red-300`,
            text: 'Fallido',
          };
        case PaymentStatus.PENDING:
          return {
            icon: <RefreshCw className="w-3 h-3 mr-1 animate-spin" />,
            className: `${baseClasses} bg-yellow-900/50 text-yellow-300`,
            text: 'Pendiente',
          };
        case PaymentStatus.CANCELLED:
          return {
            icon: <XCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-gray-700 text-gray-300`,
            text: 'Cancelado',
          };
        default:
          return {
            icon: <AlertCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-gray-700 text-gray-300`,
            text: status || 'Desconocido',
          };
      }
    } else {
      // Order status
      switch (status?.toLowerCase()) {
        case 'confirmed':
          return {
            icon: <Package className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-green-900/50 text-green-300`,
            text: 'Confirmada',
          };
        case 'pending':
          return {
            icon: <RefreshCw className="w-3 h-3 mr-1 animate-spin" />,
            className: `${baseClasses} bg-yellow-900/50 text-yellow-300`,
            text: 'Pendiente',
          };
        case 'payment_failed':
          return {
            icon: <XCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-red-900/50 text-red-300`,
            text: 'Pago Fallido',
          };
        case 'cancelled':
          return {
            icon: <XCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-gray-700 text-gray-300`,
            text: 'Cancelada',
          };
        case 'shipped':
          return {
            icon: <Truck className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-blue-900/50 text-blue-300`,
            text: 'Enviada',
          };
        default:
          return {
            icon: <AlertCircle className="w-3 h-3 mr-1" />,
            className: `${baseClasses} bg-gray-700 text-gray-300`,
            text: status || 'Desconocido',
          };
      }
    }
  };

  // Use Wompi transaction data if available, otherwise fallback to GraphQL payment data
  const currentPayment = wompiTransaction
    ? {
        id: wompiTransaction.id,
        status: mapWompiStatus(wompiTransaction.status),
        amount: wompiTransaction.amount_in_cents / 100,
        currency: wompiTransaction.currency,
        provider: 'Wompi',
        paymentMethod: wompiTransaction.payment_method?.type || 'N/A',
        createdAt: wompiTransaction.created_at,
        providerTransactionId: wompiTransaction.id,
        referenceNumber: wompiTransaction.reference,
        errorMessage:
          wompiTransaction.status === 'DECLINED' || wompiTransaction.status === 'ERROR'
            ? wompiTransaction.status_message
            : undefined,
        order: payment?.order, // Keep order info from GraphQL if available
      }
    : payment;

  // Monitor order status updates when payment is completed
  useEffect(() => {
    if (
      currentPayment?.status === PaymentStatus.COMPLETED &&
      currentPayment?.order?.status?.toLowerCase() === 'pending'
    ) {
      // Check order status every 10 seconds for up to 2 minutes
      const orderStatusInterval = setInterval(async () => {
        if (refetch) {
          await refetch();
        }
      }, 10000);

      // Clear interval after 2 minutes
      const orderTimeout = setTimeout(
        () => {
          clearInterval(orderStatusInterval);
        },
        2 * 60 * 1000
      );

      return () => {
        clearInterval(orderStatusInterval);
        clearTimeout(orderTimeout);
      };
    }
  }, [currentPayment?.status, currentPayment?.order?.status, refetch]);

  if ((loading && !payment) || (wompiLoading && !wompiTransaction && transactionId)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-semibold text-white mb-2">Verificando tu pago...</h2>
          <p className="text-gray-400">
            {updatingPayment
              ? 'Actualizando información del pago...'
              : transactionId
                ? 'Consultando estado en Wompi...'
                : 'Esto puede tomar unos momentos'}
          </p>
          {polling && !updatingPayment && (
            <p className="text-sm text-blue-400 mt-2">
              {transactionId ? `Transacción: ${transactionId}` : 'Actualizando automáticamente...'}
            </p>
          )}
          {updatingPayment && (
            <p className="text-sm text-green-400 mt-2">Sincronizando con la base de datos...</p>
          )}
        </div>
      </div>
    );
  }

  if ((error && !payment) || (wompiError && !wompiTransaction && transactionId)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error al verificar el pago</h2>
          <p className="text-gray-400 mb-4">
            {wompiError ||
              'No pudimos encontrar la información de tu pago. Por favor, contacta con soporte.'}
          </p>
          {transactionId && (
            <p className="text-sm text-gray-500 mb-4">ID de transacción: {transactionId}</p>
          )}
          <button
            onClick={() => {
              if (transactionId) {
                fetchWompiTransaction(transactionId);
              } else {
                refetch();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
          >
            Reintentar
          </button>
          <Link
            href="/support"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Contactar Soporte
          </Link>
        </div>
      </div>
    );
  }

  // Show something if we have neither payment nor wompi transaction
  if (!currentPayment && !wompiTransaction) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Información de pago no disponible
          </h2>
          <p className="text-gray-400 mb-4">No pudimos encontrar la información de este pago.</p>
          <Link
            href="/support"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Contactar Soporte
          </Link>
        </div>
      </div>
    );
  }

  const renderPaymentStatus = () => {
    const paymentToShow = currentPayment || wompiTransaction;

    switch (paymentToShow?.status) {
      case PaymentStatus.COMPLETED:
        return (
          <div className="text-center mb-8">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">¡Pago Exitoso!</h1>
            <p className="text-lg text-gray-400">
              Tu orden ha sido confirmada y está siendo procesada
            </p>
          </div>
        );

      case PaymentStatus.PENDING:
      case PaymentStatus.PROCESSING:
        return (
          <div className="text-center mb-8">
            <div className="relative">
              <RefreshCw className="w-20 h-20 text-blue-400 mx-auto mb-4 animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Procesando Pago...</h1>
            <p className="text-lg text-gray-400">
              Tu pago está siendo verificado. Por favor espera.
            </p>
            {polling && (
              <p className="text-sm text-blue-400 mt-2">Actualizando automáticamente...</p>
            )}
            {transactionId && <p className="text-xs text-gray-500 mt-2">ID: {transactionId}</p>}
          </div>
        );

      case PaymentStatus.FAILED:
        return (
          <div className="text-center mb-8">
            <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Pago Fallido</h1>
            <p className="text-lg text-gray-400">No pudimos procesar tu pago</p>
            {paymentToShow?.errorMessage && (
              <p className="text-sm text-red-400 mt-2">Motivo: {paymentToShow.errorMessage}</p>
            )}
          </div>
        );

      case PaymentStatus.CANCELLED:
        return (
          <div className="text-center mb-8">
            <Link href="/payment/cancelled">
              <AlertCircle className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Pago Cancelado</h1>
            <p className="text-lg text-gray-400">El pago fue cancelado</p>
          </div>
        );

      default:
        return (
          <div className="text-center mb-8">
            <Link href="/payment/unknown">
              <AlertCircle className="w-20 h-20 text-gray-500 mx-auto mb-4" />
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Estado Desconocido</h1>
            <p className="text-lg text-gray-400">No pudimos determinar el estado del pago</p>
          </div>
        );
    }
  };

  const renderActionButtons = () => {
    const paymentToShow = currentPayment || wompiTransaction;

    switch (paymentToShow?.status) {
      case PaymentStatus.COMPLETED:
        return (
          <div className="flex gap-4 justify-center">
            <Link
              href="/orders"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver Mis Órdenes
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Seguir Comprando
            </Link>
          </div>
        );

      case PaymentStatus.FAILED:
        return (
          <div className="flex gap-4 justify-center">
            <Link
              href={`/checkout/retry/${paymentToShow?.id || paymentId}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar Pago
            </Link>
            <Link
              href="/cart"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Volver al Carrito
            </Link>
          </div>
        );

      case PaymentStatus.CANCELLED:
        return (
          <div className="flex gap-4 justify-center">
            <Link
              href="/cart"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al Carrito
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Seguir Comprando
            </Link>
          </div>
        );

      case PaymentStatus.PENDING:
      case PaymentStatus.PROCESSING:
        return (
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                if (transactionId) {
                  fetchWompiTransaction(transactionId);
                } else {
                  refetch();
                }
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Actualizar Estado
            </button>
            <Link
              href="/support"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Contactar Soporte
            </Link>
          </div>
        );

      default:
        return (
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                if (transactionId) {
                  fetchWompiTransaction(transactionId);
                } else {
                  refetch();
                }
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Verificar Estado
            </button>
            <Link
              href="/support"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Contactar Soporte
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderPaymentStatus()}

        {/* Payment Details */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Detalles del Pago</h2>
            {updatingPayment && (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-sm text-blue-400">Actualizando...</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-400">ID de Pago</p>
              <p className="font-medium text-white">{currentPayment?.id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Estado</p>
              <p className="font-medium">
                {(() => {
                  const statusDisplay = getStatusDisplay(currentPayment?.status, true);
                  return (
                    <span className={statusDisplay.className}>
                      {statusDisplay.icon}
                      {statusDisplay.text}
                    </span>
                  );
                })()}
              </p>
            </div>
            {wompiTransaction && (
              <div>
                <p className="text-sm text-gray-400">Estado Wompi</p>
                <p className="font-medium text-xs text-white">{wompiTransaction.status}</p>
                {wompiTransaction.status_message && (
                  <p className="text-xs text-gray-500">{wompiTransaction.status_message}</p>
                )}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-400">Monto</p>
              <p className="font-medium text-white">
                ${currentPayment?.amount?.toLocaleString('es-CO') || 'N/A'}{' '}
                {currentPayment?.currency || ''}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Proveedor</p>
              <p className="font-medium text-white">{currentPayment?.provider || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Método de Pago</p>
              <p className="font-medium text-white">{currentPayment?.paymentMethod || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Fecha</p>
              <p className="font-medium text-white">
                {currentPayment?.createdAt
                  ? new Date(currentPayment.createdAt).toLocaleString('es-CO')
                  : 'N/A'}
              </p>
            </div>
            {(currentPayment?.providerTransactionId || transactionId) && (
              <div>
                <p className="text-sm text-gray-400">ID de Transacción</p>
                <p className="font-medium text-xs text-white">
                  {currentPayment?.providerTransactionId || transactionId}
                </p>
              </div>
            )}
            {currentPayment?.referenceNumber && (
              <div>
                <p className="text-sm text-gray-400">Referencia</p>
                <p className="font-medium text-xs text-white">{currentPayment.referenceNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Information */}
        {currentPayment?.order && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Información de la Orden</h2>

            {/* Payment and Order Status Sync Indicator */}
            {currentPayment?.status === PaymentStatus.COMPLETED && (
              <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {currentPayment.order.status?.toLowerCase() === 'confirmed' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-medium text-green-300">
                        Pago y orden sincronizados correctamente
                      </span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                      <span className="text-sm font-medium text-blue-300">
                        Sincronizando estado de la orden...
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400">Número de Orden</p>
                <p className="font-medium text-white">{currentPayment.order.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="font-medium text-white">
                  ${currentPayment?.amount?.toLocaleString('es-CO') || 'N/A'}{' '}
                  {currentPayment?.currency || ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Estado de la Orden</p>
                <div className="font-medium">
                  {(() => {
                    const statusDisplay = getStatusDisplay(currentPayment.order.status, false);
                    return (
                      <span className={statusDisplay.className}>
                        {statusDisplay.icon}
                        {statusDisplay.text}
                      </span>
                    );
                  })()}
                </div>
                {currentPayment?.status === PaymentStatus.COMPLETED &&
                  currentPayment.order.status?.toLowerCase() === 'confirmed' && (
                    <p className="text-xs text-green-400 mt-1 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      La orden ha sido confirmada exitosamente
                    </p>
                  )}
                {currentPayment.order.status?.toLowerCase() === 'pending' && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    El estado de la orden se actualizará automáticamente
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Wompi Transaction Information */}
        {wompiTransaction && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Información Detallada de la Transacción
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400">Email del Cliente</p>
                <p className="font-medium text-xs text-white">{wompiTransaction.customer_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Tipo de Pago</p>
                <p className="font-medium text-white">{wompiTransaction.payment_method_type}</p>
              </div>
              {wompiTransaction.payment_method?.extra && (
                <>
                  <div>
                    <p className="text-sm text-gray-400">Marca de Tarjeta</p>
                    <p className="font-medium text-white">
                      {wompiTransaction.payment_method.extra.brand} -{' '}
                      {wompiTransaction.payment_method.extra.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Últimos 4 Dígitos</p>
                    <p className="font-medium text-white">
                      ****{wompiTransaction.payment_method.extra.last_four}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Tipo de Tarjeta</p>
                    <p className="font-medium text-white">
                      {wompiTransaction.payment_method.extra.card_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Titular</p>
                    <p className="font-medium text-white">
                      {wompiTransaction.payment_method.extra.card_holder}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">3D Secure</p>
                    <p className="font-medium">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          wompiTransaction.payment_method.extra.is_three_ds
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {wompiTransaction.payment_method.extra.is_three_ds
                          ? 'Activado'
                          : 'No activado'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Cuotas</p>
                    <p className="font-medium text-white">
                      {wompiTransaction.payment_method.installments}
                    </p>
                  </div>
                </>
              )}
              {wompiTransaction.finalized_at && (
                <div>
                  <p className="text-sm text-gray-400">Finalizado</p>
                  <p className="font-medium text-white">
                    {new Date(wompiTransaction.finalized_at).toLocaleString('es-CO')}
                  </p>
                </div>
              )}
              {wompiTransaction.customer_data && (
                <>
                  <div>
                    <p className="text-sm text-gray-400">Nombre Completo</p>
                    <p className="font-medium text-white">
                      {wompiTransaction.customer_data.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Teléfono</p>
                    <p className="font-medium text-white">
                      {wompiTransaction.customer_data.phone_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Documento</p>
                    <p className="font-medium text-white">
                      {wompiTransaction.customer_data.legal_id_type}:{' '}
                      {wompiTransaction.customer_data.legal_id}
                    </p>
                  </div>
                </>
              )}
              {wompiTransaction.taxes && wompiTransaction.taxes.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-400 mb-2">Impuestos</p>
                  <div className="bg-gray-750 border border-gray-600 p-3 rounded-lg">
                    {wompiTransaction.taxes.map((tax, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">{tax.type}:</span>
                        <span className="font-medium text-white">
                          ${(tax.amount_in_cents / 100).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {wompiTransaction.shipping_address && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-400 mb-2">Dirección de Envío</p>
                  <div className="bg-gray-750 border border-gray-600 p-3 rounded-lg">
                    <p className="font-medium text-white">
                      {wompiTransaction.shipping_address.name}
                    </p>
                    <p className="text-gray-300">
                      {wompiTransaction.shipping_address.address_line_1}
                    </p>
                    <p className="text-gray-300">
                      {wompiTransaction.shipping_address.city},{' '}
                      {wompiTransaction.shipping_address.region}
                    </p>
                    <p className="text-gray-300">{wompiTransaction.shipping_address.country}</p>
                    <p className="text-gray-300">
                      Tel: {wompiTransaction.shipping_address.phone_number}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center">{renderActionButtons()}</div>

        {/* Support Information */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            ¿Tienes algún problema?{' '}
            <Link href="/support" className="text-blue-400 hover:text-blue-300">
              Contacta nuestro soporte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
