'use client';

import { useState, useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useSessionStore } from '@/lib/store/dashboard';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Download,
  Filter,
} from 'lucide-react';

const GET_EXPENSES = gql`
  query GetExpensesByProvider($serviceProviderId: String!) {
    expensesByProvider(serviceProviderId: $serviceProviderId) {
      id
      date
      category
      description
      amount
      paymentMethod
      createdAt
    }
  }
`;

const GET_APPOINTMENTS = gql`
  query GetAppointmentsByProviderExp($serviceProviderId: String!) {
    appointmentsByProvider(serviceProviderId: $serviceProviderId) {
      id
      serviceId
      startDatetime
      status
      paymentStatus
      customerName
      customerEmail
    }
  }
`;

const GET_SERVICES = gql`
  query GetServicesByProviderExp($serviceProviderId: String!) {
    servicesByProvider(serviceProviderId: $serviceProviderId) {
      id
      name
      priceAmount
    }
  }
`;

const CREATE_EXPENSE = gql`
  mutation CreateExpense($data: CreateExpenseInput!) {
    createExpense(data: $data) {
      id
      date
      category
      description
      amount
      paymentMethod
      createdAt
    }
  }
`;

const UPDATE_EXPENSE = gql`
  mutation UpdateExpense($id: String!, $data: UpdateExpenseInput!) {
    updateExpense(id: $id, data: $data) {
      id
      date
      category
      description
      amount
      paymentMethod
    }
  }
`;

const DELETE_EXPENSE = gql`
  mutation DeleteExpense($id: String!) {
    deleteExpense(id: $id) {
      id
    }
  }
`;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
}

const CATEGORIES = [
  'Materiales',
  'Transporte',
  'Herramientas',
  'Marketing',
  'Arrendamiento',
  'Servicios públicos',
  'Nómina',
  'Software',
  'Capacitación',
  'Otros',
];

const PAYMENT_METHODS = [
  'Efectivo',
  'Transferencia',
  'Tarjeta crédito',
  'Tarjeta débito',
  'Nequi/Daviplata',
  'Cheque',
];

const PERIOD_OPTIONS = [
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensual' },
  { key: 'custom', label: 'Personalizado' },
] as const;

type Period = (typeof PERIOD_OPTIONS)[number]['key'];

const parseDate = (value: string): Date => {
  // Only treat as ms timestamp if the string is purely numeric (no letters or dashes)
  if (/^\d+$/.test(value.trim())) {
    return new Date(parseInt(value, 10));
  }
  return new Date(value);
};

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

export default function ServiceExpenses() {
  const { user } = useSessionStore();
  const serviceProviderId = user?.serviceProviderId;

  const {
    data: expensesData,
    loading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useQuery(GET_EXPENSES, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
    fetchPolicy: 'network-only',
  });
  const { data: appointmentsData } = useQuery(GET_APPOINTMENTS, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });
  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { serviceProviderId: serviceProviderId || '' },
    skip: !serviceProviderId,
  });

  const [createExpense] = useMutation(CREATE_EXPENSE);
  const [updateExpense] = useMutation(UPDATE_EXPENSE);
  const [deleteExpense] = useMutation(DELETE_EXPENSE);

  const [activeTab, setActiveTab] = useState<'expenses' | 'earnings'>('expenses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [period, setPeriod] = useState<Period>('monthly');
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().split('T')[0]);

  const emptyForm = {
    date: new Date().toISOString().split('T')[0],
    category: CATEGORIES[0],
    description: '',
    amount: 0,
    paymentMethod: PAYMENT_METHODS[0],
  };
  const [form, setForm] = useState(emptyForm);

  const { rangeFrom, rangeTo } = useMemo(() => {
    const now = new Date();
    if (period === 'weekly') {
      const day = now.getDay();
      const from = new Date(now);
      from.setDate(now.getDate() - day);
      from.setHours(0, 0, 0, 0);
      // end of week (Saturday)
      const to = new Date(from);
      to.setDate(from.getDate() + 6);
      to.setHours(23, 59, 59, 999);
      return { rangeFrom: from, rangeTo: to };
    }
    if (period === 'monthly') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      // end of month
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      to.setHours(23, 59, 59, 999);
      return { rangeFrom: from, rangeTo: to };
    }
    // custom
    const from = new Date(customFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(customTo);
    to.setHours(23, 59, 59, 999);
    return { rangeFrom: from, rangeTo: to };
  }, [period, customFrom, customTo]);

  const expenses: Expense[] = useMemo(() => expensesData?.expensesByProvider || [], [expensesData]);

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const d = parseDate(e.date);
        return d >= rangeFrom && d <= rangeTo;
      }),
    [expenses, rangeFrom, rangeTo]
  );

  // Earnings (paid appointments in range)
  const earnings = useMemo(() => {
    const apts: any[] = appointmentsData?.appointmentsByProvider || [];
    const svcs: any[] = servicesData?.servicesByProvider || [];
    return apts
      .filter((apt: any) => {
        const d = parseDate(apt.startDatetime);
        if (d < rangeFrom || d > rangeTo) return false;
        if (apt.status !== 'CONFIRMED' && apt.status !== 'COMPLETED') return false;
        if (apt.paymentStatus !== 'PAID') return false;
        return true;
      })
      .map((apt: any) => {
        const svc = svcs.find((s: any) => s.id === apt.serviceId);
        return {
          ...apt,
          serviceName: svc?.name || 'Servicio',
          amount: svc?.priceAmount || 0,
        };
      })
      .sort(
        (a: any, b: any) =>
          parseDate(b.startDatetime).getTime() - parseDate(a.startDatetime).getTime()
      );
  }, [appointmentsData, servicesData, rangeFrom, rangeTo]);

  // Total ingresos (solo citas pagadas)
  const totalIncome = useMemo(() => {
    const apts: any[] = appointmentsData?.appointmentsByProvider || [];
    const svcs: any[] = servicesData?.servicesByProvider || [];
    return apts.reduce((sum: number, apt: any) => {
      const d = parseDate(apt.startDatetime);
      if (d < rangeFrom || d > rangeTo) return sum;
      if (apt.status !== 'CONFIRMED' && apt.status !== 'COMPLETED') return sum;
      if (apt.paymentStatus !== 'PAID') return sum; // Solo contabilizar pagos confirmados
      const svc = svcs.find((s: any) => s.id === apt.serviceId);
      return sum + (svc?.priceAmount || 0);
    }, 0);
  }, [appointmentsData, servicesData, rangeFrom, rangeTo]);

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((s, e) => s + e.amount, 0),
    [filteredExpenses]
  );
  const netBalance = totalIncome - totalExpenses;

  // ── Handlers ────────────────────────────────────────────────

  const openCreate = () => {
    setEditingExpense(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setForm({
      date: parseDate(expense.date).toISOString().split('T')[0],
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingExpense) {
        await updateExpense({
          variables: { id: editingExpense.id, data: { ...form, amount: Number(form.amount) } },
        });
      } else {
        await createExpense({
          variables: { data: { ...form, amount: Number(form.amount), serviceProviderId } },
        });
      }
      await refetchExpenses();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving expense:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      await deleteExpense({ variables: { id } });
      await refetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const handleExportCSV = () => {
    if (activeTab === 'expenses') {
      const headers = ['Fecha', 'Categoría', 'Descripción', 'Valor', 'Método de pago'];
      const rows = filteredExpenses.map((e) => [
        parseDate(e.date).toLocaleDateString('es-CO'),
        e.category,
        e.description,
        e.amount,
        e.paymentMethod,
      ]);
      const csv = [headers, ...rows].map((r) => r.map(String).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gastos-${period}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['Fecha', 'Cliente', 'Email', 'Servicio', 'Valor'];
      const rows = earnings.map((e: any) => [
        parseDate(e.startDatetime).toLocaleDateString('es-CO'),
        e.customerName || '',
        e.customerEmail || '',
        e.serviceName,
        e.amount,
      ]);
      const csv = [headers, ...rows].map((r) => r.map(String).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ganancias-${period}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!serviceProviderId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          No se encontró el proveedor de servicios.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Asegúrate de haber iniciado sesión con una cuenta de proveedor de servicios.
        </p>
      </div>
    );
  }

  if (expensesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-4 border-fourth-base border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-gray-400">Cargando gastos...</p>
      </div>
    );
  }

  if (expensesError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-lg w-full">
          <h3 className="text-red-700 dark:text-red-400 font-semibold mb-2">
            Error al cargar los gastos
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300 font-mono break-all">
            {expensesError.message}
          </p>
        </div>
        <button
          onClick={() => refetchExpenses()}
          className="px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const inputCls =
    'w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeTab === 'expenses' ? 'Gastos Operativos' : 'Ganancias'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {activeTab === 'expenses'
              ? 'Registra y analiza tus gastos del negocio'
              : 'Revisa tus ingresos por servicios pagados'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          {activeTab === 'expenses' && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Nuevo Gasto
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1.5 inline-flex gap-1">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'expenses'
              ? 'bg-fourth-base text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Gastos
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'earnings'
              ? 'bg-fourth-base text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Ganancias
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-gray-400" />
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === p.key
                ? 'bg-fourth-base text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex gap-2 items-center ml-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className={inputCls + ' max-w-[160px]'}
            />
            <span className="text-gray-500">–</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className={inputCls + ' max-w-[160px]'}
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Ingresos</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCOP(totalIncome)}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex items-center gap-4">
          <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
            <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Gastos</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCOP(totalExpenses)}
            </p>
          </div>
        </div>
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg border p-6 flex items-center gap-4 ${
            netBalance >= 0
              ? 'border-green-300 dark:border-green-700'
              : 'border-red-300 dark:border-red-700'
          }`}
        >
          <div
            className={`p-3 rounded-full ${netBalance >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
          >
            <DollarSign
              className={`h-6 w-6 ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}
            />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Balance Neto</p>
            <p
              className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {formatCOP(netBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Registro de Gastos — {filteredExpenses.length} registros
            </h2>
          </div>
          {filteredExpenses.length === 0 ? (
            <div className="p-10 text-center text-gray-500 dark:text-gray-400">
              No hay gastos registrados en este período.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {['Fecha', 'Categoría', 'Descripción', 'Valor', 'Método de Pago', ''].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredExpenses
                    .slice()
                    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
                    .map((expense) => (
                      <tr
                        key={expense.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                      >
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {parseDate(expense.date).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                          {expense.description || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                          {formatCOP(expense.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {expense.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap flex gap-2 justify-end">
                          <button
                            onClick={() => openEdit(expense)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Total del período
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-red-600 dark:text-red-400">
                      {formatCOP(totalExpenses)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Earnings Table */}
      {activeTab === 'earnings' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Registro de Ganancias — {earnings.length} registros
            </h2>
          </div>
          {earnings.length === 0 ? (
            <div className="p-10 text-center text-gray-500 dark:text-gray-400">
              No hay ganancias registradas en este período.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {['Fecha', 'Cliente', 'Servicio', 'Valor', 'Estado'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {earnings.map((earning: any) => (
                    <tr
                      key={earning.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {parseDate(earning.startDatetime).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="font-medium">{earning.customerName || '—'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {earning.customerEmail || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {earning.serviceName}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                        {formatCOP(earning.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Pagado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Total del período
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-green-600 dark:text-green-400">
                      {formatCOP(totalIncome)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Valor (COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Categoría
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Descripción
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputCls}
                  placeholder="Compra de materiales..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Método de Pago
                </label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className={inputCls}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 text-sm"
              >
                <Check className="h-4 w-4" />
                {editingExpense ? 'Actualizar' : 'Crear Gasto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
