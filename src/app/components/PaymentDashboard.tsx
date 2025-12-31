'use client';
import React, { useState } from 'react';

import {
  CreditCard,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Eye,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useStorePaymentConfiguration } from '@/lib/hooks/useStorePaymentConfiguration';
import { usePayments, usePaymentSummary } from '@/lib/hooks/usePayments';
import { Payment, PaymentMethod, PaymentProvider, PaymentStatus } from '../utils/types/payment';
import Layout from './layout';

export default function PaymentDashboard() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0], // today
  });

  const {
    payments,
    loading: paymentsLoading,
    error: paymentsError,
    filters,
    setFilters,
    refetch: refetchPayments,
  } = usePayments();

  const { summary, loading: summaryLoading, error: summaryError } = usePaymentSummary(dateRange);

  const { configuration, isWompiEnabled, isMercadoPagoEnabled, isEpaycoEnabled } =
    useStorePaymentConfiguration();
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELLED:
        return <XCircle className="w-4 h-4 text-red-400" />;
      case PaymentStatus.PENDING:
      case PaymentStatus.PROCESSING:
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'bg-green-900/30 text-green-300 border border-green-800';
      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELLED:
        return 'bg-red-900/30 text-red-300 border border-red-800';
      case PaymentStatus.PENDING:
      case PaymentStatus.PROCESSING:
        return 'bg-yellow-900/30 text-yellow-300 border border-yellow-800';
      default:
        return 'bg-gray-700/50 text-gray-300 border border-gray-600';
    }
  };

  const paymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'Completado';
      case PaymentStatus.FAILED:
        return 'Fallido';
      case PaymentStatus.CANCELLED:
        return 'Cancelado';
      case PaymentStatus.PENDING:
        return 'Pendiente';
      case PaymentStatus.PROCESSING:
        return 'En proceso';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (summaryLoading || paymentsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Cargando dashboard de pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard de Pagos</h1>
          <p className="text-gray-400 mt-2">Gestiona y monitorea todos los pagos de tu tienda</p>
        </div>

        {/* Payment Provider Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            className={`p-4 rounded-lg border ${
              isWompiEnabled
                ? 'bg-green-900/20 border-green-700 shadow-lg shadow-green-900/20'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">Wompi</h3>
                <p className={`text-sm ${isWompiEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                  {isWompiEnabled ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <CreditCard
                className={`w-8 h-8 ${isWompiEnabled ? 'text-green-400' : 'text-gray-500'}`}
              />
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              isMercadoPagoEnabled
                ? 'bg-blue-900/20 border-blue-700 shadow-lg shadow-blue-900/20'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">MercadoPago</h3>
                <p
                  className={`text-sm ${isMercadoPagoEnabled ? 'text-blue-400' : 'text-gray-500'}`}
                >
                  {isMercadoPagoEnabled ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <CreditCard
                className={`w-8 h-8 ${isMercadoPagoEnabled ? 'text-blue-400' : 'text-gray-500'}`}
              />
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              isEpaycoEnabled
                ? 'bg-purple-900/20 border-purple-700 shadow-lg shadow-purple-900/20'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">ePayco</h3>
                <p className={`text-sm ${isEpaycoEnabled ? 'text-purple-400' : 'text-gray-500'}`}>
                  {isEpaycoEnabled ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <CreditCard
                className={`w-8 h-8 ${isEpaycoEnabled ? 'text-purple-400' : 'text-gray-500'}`}
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-900/30 rounded-lg border border-blue-700">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Pagos</p>
                  <p className="text-2xl font-bold text-white">{summary.totalPayments}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-900/30 rounded-lg border border-green-700">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Completados</p>
                  <p className="text-2xl font-bold text-white">{summary.completedPayments}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-900/30 rounded-lg border border-yellow-700">
                  <DollarSign className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Monto Total</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(summary.totalAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-700">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Tasa de Éxito</p>
                  <p className="text-2xl font-bold text-white">{summary.successRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Filtros</h2>
            <Filter className="w-5 h-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estado</label>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: (e.target.value as PaymentStatus) || undefined,
                  })
                }
                className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los Estados</option>
                {Object.values(PaymentStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Proveedor</label>
              <select
                value={filters.provider || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    provider: (e.target.value as PaymentProvider) || undefined,
                  })
                }
                className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los Proveedores</option>
                {Object.values(PaymentProvider).map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Método</label>
              <select
                value={filters.paymentMethod || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    paymentMethod: (e.target.value as PaymentMethod) || undefined,
                  })
                }
                className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los Métodos</option>
                {Object.values(PaymentMethod).map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={filters.customerEmail || ''}
                onChange={(e) =>
                  setFilters({ ...filters, customerEmail: e.target.value || undefined })
                }
                placeholder="Buscar por email"
                className="w-full p-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => refetchPayments()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-lg"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Pagos Recientes</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {payments.map((payment: Payment) => (
                  <tr key={payment.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {payment.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {formatCurrency(payment.amount)} {payment.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(payment.status)}
                        <span
                          className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {payment.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {payment.customerEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(payment.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal de detalle de pago */}
          {showModal && selectedPayment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => {
                  setShowModal(false);
                  setSelectedPayment(null);
                }}
              />

              <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Detalle del Pago
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedPayment(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="p-6 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">ID</p>
                      <p className="font-medium">{selectedPayment.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Monto</p>
                      <p className="font-medium">
                        {formatCurrency(selectedPayment.amount)} {selectedPayment.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Estado</p>
                      <p className="font-medium">{paymentStatusLabel(selectedPayment.status)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Proveedor</p>
                      <p className="font-medium">{selectedPayment.provider}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Cliente</p>
                      <p className="font-medium">{selectedPayment.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Fecha</p>
                      <p className="font-medium">
                        {new Date(selectedPayment.createdAt).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedPayment(null);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {payments.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No se encontraron pagos</p>
            </div>
          )}
        </div>

        {/* Error States */}
        {(paymentsError || summaryError) && (
          <div className="mt-8 bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-300">
                Error al cargar los datos: {paymentsError?.message || summaryError?.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
