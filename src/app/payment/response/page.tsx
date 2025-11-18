'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEPaycoPayment } from '@/lib/hooks/useEPaycoPayment';
import { LoaderIcon } from 'react-hot-toast';

function PaymentResponsePage() {
  const searchParams = useSearchParams();
  const { processResponse, loading } = useEPaycoPayment();
  const [paymentStatus, setPaymentStatus] = useState<
    'processing' | 'success' | 'error' | 'pending'
  >('processing');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [hasProcessed, setHasProcessed] = useState(false);
  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed) return;
    const processPaymentResponse = async () => {
      try {
        // Obtener ref_payco de los parámetros de la URL
        const refPayco = searchParams.get('ref_payco');
        if (!refPayco) {
          console.error('No ref_payco found in URL');
          setPaymentStatus('error');
          setHasProcessed(true);
          return;
        }

        setHasProcessed(true);
        console.log('Validando pago con ref_payco:', refPayco);

        // Validar el pago con ePayco
        const epaycoResponse = await fetch(
          `https://secure.epayco.co/validation/v1/reference/${refPayco}`
        );

        if (!epaycoResponse.ok) {
          throw new Error('Error al validar el pago con ePayco');
        }

        const epaycoData = await epaycoResponse.json();
        console.log('Respuesta de ePayco:', epaycoData);

        if (!epaycoData.success) {
          setPaymentStatus('error');
          return;
        }

        const info = epaycoData.data;

        // Preparar datos para mostrar
        const paymentInfo = {
          transactionId: info.x_transaction_id || info.x_ref_payco || refPayco,
          referenceCode: info.x_id_invoice || refPayco,
          amount: info.x_amount || '0',
          currency: info.x_currency_code || 'COP',
          franchise: info.x_franchise || 'N/A',
          email: info.x_customer_email || '',
          transactionDate: info.x_transaction_date || new Date().toISOString(),
          transactionState: info.x_transaction_state || info.x_response || 'Pendiente',
          order: {
            total: Number(info.x_amount || 0),
          },
        };

        setPaymentData(paymentInfo);

        // Determinar el estado basado en la respuesta de ePayco
        const state = info.x_transaction_state || info.x_response || '';
        const responseCode = info.x_cod_response || info.x_cod_transaction_state;

        if (state === 'Aceptada' || responseCode === '1') {
          setPaymentStatus('success');

          // Actualizar el estado del pago en el backend
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL;
            console.log('Actualizando estado en backend:', backendUrl);

            const backendResponse = await fetch(`${backendUrl}/payments/epayco/confirm`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ref_payco: refPayco,
                transaction_id: info.x_transaction_id,
                reference: info.x_id_invoice,
                amount: info.x_amount,
                currency: info.x_currency_code || 'COP',
                franchise: info.x_franchise,
                email: info.x_customer_email,
                transaction_state: state,
                response_code: responseCode,
                approval_code: info.x_approval_code,
                transaction_date: info.x_transaction_date,
                status: 'COMPLETED',
              }),
            });

            if (!backendResponse.ok) {
              console.error('Error actualizando backend:', await backendResponse.text());
            } else {
              const backendData = await backendResponse.json();
              console.log('Backend actualizado exitosamente:', backendData);
            }
          } catch (backendError) {
            console.error('Error al comunicarse con el backend:', backendError);
            // No cambiar el estado, el pago ya fue validado con ePayco
          }

          // Procesar con el hook si existe
          try {
            await processResponse({
              ref_payco: refPayco,
              x_id_invoice: info.x_id_invoice,
              x_transaction_id: info.x_transaction_id,
              x_ref_payco: info.x_ref_payco,
              x_cod_response: responseCode,
              x_response: state,
              x_approval_code: info.x_approval_code,
              x_amount: info.x_amount,
              x_franchise: info.x_franchise,
              x_customer_email: info.x_customer_email,
            });
          } catch (hookError) {
            console.error('Error processing with hook:', hookError);
            // No cambiar el estado, ya se validó con ePayco
          }
        } else if (state === 'Rechazada' || state === 'Fallida' || responseCode === '2') {
          setPaymentStatus('error');

          // Actualizar el estado como fallido en el backend
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL;
            await fetch(`${backendUrl}/payments/epayco/confirm`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ref_payco: refPayco,
                transaction_id: info.x_transaction_id,
                reference: info.x_id_invoice,
                amount: info.x_amount,
                transaction_state: state,
                response_code: responseCode,
                status: 'FAILED',
              }),
            });
          } catch (backendError) {
            console.error('Error actualizando backend con estado fallido:', backendError);
          }
        } else if (state === 'Pendiente' || responseCode === '3') {
          setPaymentStatus('pending');

          // Actualizar el estado como pendiente en el backend
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL;
            await fetch(`${backendUrl}/payments/epayco/confirm`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ref_payco: refPayco,
                transaction_id: info.x_transaction_id,
                reference: info.x_id_invoice,
                amount: info.x_amount,
                transaction_state: state,
                response_code: responseCode,
                status: 'PENDING',
              }),
            });
          } catch (backendError) {
            console.error('Error actualizando backend con estado pendiente:', backendError);
          }
        } else {
          setPaymentStatus('pending');
        }
      } catch (error) {
        console.error('Error procesando respuesta de pago:', error);
        setPaymentStatus('error');
      }
    };

    if (searchParams.get('ref_payco') && !hasProcessed) {
      processPaymentResponse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500 mx-auto" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500 mx-auto" />;
      default:
        return (
          <div className="w-16 h-16 border-4 border-fourth-base border-t-transparent rounded-full animate-spin mx-auto" />
        );
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          title: '¡Pago exitoso!',
          message: 'Tu suscripción ha sido activada correctamente.',
          color: 'text-green-400',
        };
      case 'error':
        return {
          title: 'Pago rechazado',
          message: 'Hubo un problema procesando tu pago. Intenta nuevamente.',
          color: 'text-red-400',
        };
      case 'pending':
        return {
          title: 'Pago pendiente',
          message: 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
          color: 'text-yellow-400',
        };
      default:
        return {
          title: 'Procesando pago...',
          message: 'Estamos verificando tu pago, por favor espera.',
          color: 'text-gray-400',
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center shadow-2xl border border-gray-700">
        {getStatusIcon()}

        <h1 className={`text-2xl font-bold mt-6 mb-3 ${statusInfo.color}`}>{statusInfo.title}</h1>

        <p className="text-gray-300 mb-6 leading-relaxed">{statusInfo.message}</p>

        {paymentData && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Detalles del pago:</h3>
            <div className="space-y-2 text-sm text-gray-400">
              {paymentData.transactionId && (
                <div className="flex justify-between">
                  <span>ID Transacción:</span>
                  <span className="text-white font-medium">{paymentData.transactionId}</span>
                </div>
              )}
              {paymentData.referenceCode && (
                <div className="flex justify-between">
                  <span>Referencia:</span>
                  <span className="text-white font-medium">{paymentData.referenceCode}</span>
                </div>
              )}
              {paymentData.transactionState && (
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <span className="text-white font-medium">{paymentData.transactionState}</span>
                </div>
              )}
              {paymentData.franchise && paymentData.franchise !== 'N/A' && (
                <div className="flex justify-between">
                  <span>Método de pago:</span>
                  <span className="text-white font-medium">{paymentData.franchise}</span>
                </div>
              )}
              {paymentData.amount && (
                <div className="flex justify-between">
                  <span>Monto:</span>
                  <span className="text-white font-medium">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: paymentData.currency || 'COP',
                    }).format(Number(paymentData.amount))}
                  </span>
                </div>
              )}
              {paymentData.transactionDate && (
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span className="text-white font-medium">
                    {new Date(paymentData.transactionDate).toLocaleString('es-CO')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {paymentStatus === 'success' && (
            <Link
              href="/dashboard"
              className="w-full bg-gradient-to-r from-fourth-base to-fourth-500 text-white py-3 px-6 rounded-lg hover:from-fourth-600 hover:to-fourth-700 transition font-medium"
            >
              Ir al Dashboard
            </Link>
          )}

          {paymentStatus === 'error' && (
            <Link
              href="/dashboard/plans"
              className="w-full bg-gradient-to-r from-fourth-base to-fourth-500 text-white py-3 px-6 rounded-lg hover:from-fourth-600 hover:to-fourth-700 transition font-medium"
            >
              Intentar nuevamente
            </Link>
          )}

          <Link
            href="/dashboard/plans"
            className="flex items-center justify-center gap-2 w-full border border-gray-600 text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-700/50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a planes
          </Link>
        </div>

        {loading && (
          <div className="mt-4 text-sm text-gray-400">Procesando información del pago...</div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoaderIcon />}>
      <PaymentResponsePage />
    </Suspense>
  );
}
