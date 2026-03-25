'use client';

import { useState, useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { useSessionStore } from '@/lib/store/dashboard';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Search,
  Users,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import { SectionLoader } from '@/app/components/Loader';

const GET_EMPLOYEES = gql`
  query GetEmployeesByRestaurant($restaurantId: String!) {
    employeesByRestaurant(restaurantId: $restaurantId) {
      id
      firstName
      lastName
      email
      phone
      address
      role
      salary
      salaryType
      eps
      pension
      cedula
      startDate
      status
      emergencyContactName
      emergencyContactPhone
      notes
      createdAt
    }
  }
`;

const CREATE_EMPLOYEE = gql`
  mutation CreateRestaurantEmployee($data: CreateRestaurantEmployeeInput!) {
    createRestaurantEmployee(data: $data) {
      id
      firstName
      lastName
      email
      phone
      address
      role
      salary
      salaryType
      eps
      pension
      cedula
      startDate
      status
      emergencyContactName
      emergencyContactPhone
      notes
      createdAt
    }
  }
`;

const UPDATE_EMPLOYEE = gql`
  mutation UpdateRestaurantEmployee($id: String!, $data: UpdateRestaurantEmployeeInput!) {
    updateRestaurantEmployee(id: $id, data: $data) {
      id
      firstName
      lastName
      email
      phone
      address
      role
      salary
      salaryType
      eps
      pension
      cedula
      startDate
      status
      emergencyContactName
      emergencyContactPhone
      notes
    }
  }
`;

const DELETE_EMPLOYEE = gql`
  mutation DeleteRestaurantEmployee($id: String!) {
    deleteRestaurantEmployee(id: $id) {
      id
    }
  }
`;

const ROLES = [
  'Mesero/a',
  'Cajero/a',
  'Chef',
  'Cocinero/a',
  'Auxiliar de cocina',
  'Bartender',
  'Domiciliario',
  'Lavaplatos',
  'Administrador/a',
  'Supervisor/a',
  'Recepcionista',
  'Seguridad',
  'Personal de aseo',
  'Otro',
];

const EPS_LIST = [
  'Sura',
  'Sanitas',
  'Nueva EPS',
  'Compensar',
  'Famisanar',
  'Coomeva',
  'Salud Total',
  'Medimás',
  'Capital Salud',
  'Otra',
];

const PENSION_LIST = ['Colpensiones', 'Porvenir', 'Protección', 'Colfondos', 'Old Mutual', 'Otra'];

const SALARY_TYPES = [
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'BIWEEKLY', label: 'Quincenal' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'DAILY', label: 'Por día' },
  { value: 'HOURLY', label: 'Por hora' },
];

const STATUS_OPTIONS = [
  {
    value: 'ACTIVE',
    label: 'Activo',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  {
    value: 'INACTIVE',
    label: 'Inactivo',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
  {
    value: 'ON_LEAVE',
    label: 'En licencia',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
];

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  salary: number;
  salaryType: string;
  eps: string;
  pension: string;
  cedula: string;
  startDate: string;
  status: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  createdAt: string;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

const parseDate = (value: string): Date => {
  if (/^\d+$/.test(value.trim())) return new Date(parseInt(value, 10));
  return new Date(value);
};

const getStatusBadge = (status: string) => {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
};

const getSalaryLabel = (type: string) => SALARY_TYPES.find((t) => t.value === type)?.label || type;

const getInitials = (first: string, last: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  role: ROLES[0],
  salary: 0,
  salaryType: 'MONTHLY',
  eps: EPS_LIST[0],
  pension: PENSION_LIST[0],
  cedula: '',
  startDate: new Date().toISOString().split('T')[0],
  status: 'ACTIVE',
  emergencyContactName: '',
  emergencyContactPhone: '',
  notes: '',
};

export default function RestaurantPayroll() {
  const { user } = useSessionStore();
  const restaurantId = user?.restaurantId;

  const { data, loading, error, refetch } = useQuery(GET_EMPLOYEES, {
    variables: { restaurantId: restaurantId || '' },
    skip: !restaurantId,
    fetchPolicy: 'network-only',
  });

  const [createEmployee] = useMutation(CREATE_EMPLOYEE);
  const [updateEmployee] = useMutation(UPDATE_EMPLOYEE);
  const [deleteEmployee] = useMutation(DELETE_EMPLOYEE);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [epsOther, setEpsOther] = useState('');
  const [pensionOther, setPensionOther] = useState('');

  const employees: Employee[] = useMemo(() => data?.employeesByRestaurant || [], [data]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
      if (search && !fullName.includes(search.toLowerCase()) && !e.cedula.includes(search))
        return false;
      if (roleFilter && e.role !== roleFilter) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      return true;
    });
  }, [employees, search, roleFilter, statusFilter]);

  const activeCount = useMemo(
    () => employees.filter((e) => e.status === 'ACTIVE').length,
    [employees]
  );

  const totalPayroll = useMemo(
    () =>
      employees
        .filter((e) => e.status === 'ACTIVE' && e.salaryType === 'MONTHLY')
        .reduce((s, e) => s + e.salary, 0),
    [employees]
  );

  const openCreate = () => {
    setEditingEmployee(null);
    setForm({ ...emptyForm });
    setEpsOther('');
    setPensionOther('');
    setIsModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    const epsInList = EPS_LIST.includes(emp.eps);
    const pensionInList = PENSION_LIST.includes(emp.pension);
    setEpsOther(epsInList ? '' : emp.eps);
    setPensionOther(pensionInList ? '' : emp.pension);
    setForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      address: emp.address,
      role: emp.role,
      salary: emp.salary,
      salaryType: emp.salaryType,
      eps: epsInList ? emp.eps : 'Otra',
      pension: pensionInList ? emp.pension : 'Otra',
      cedula: emp.cedula,
      startDate: emp.startDate ? parseDate(emp.startDate).toISOString().split('T')[0] : '',
      status: emp.status,
      emergencyContactName: emp.emergencyContactName || '',
      emergencyContactPhone: emp.emergencyContactPhone || '',
      notes: emp.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        salary: Number(form.salary),
        eps: form.eps === 'Otra' ? epsOther.trim() || 'Otra' : form.eps,
        pension: form.pension === 'Otra' ? pensionOther.trim() || 'Otra' : form.pension,
      };
      if (editingEmployee) {
        await updateEmployee({ variables: { id: editingEmployee.id, data: payload } });
      } else {
        await createEmployee({ variables: { data: { ...payload, restaurantId } } });
      }
      await refetch();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving employee:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 min-w-[220px]">
          <p className="text-sm font-semibold text-gray-900">¿Eliminar este empleado?</p>
          <p className="text-xs text-gray-500">Esta acción no se puede deshacer.</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteEmployee({ variables: { id } });
                  await refetch();
                  toast.success('Empleado eliminado correctamente.');
                } catch (err) {
                  console.error('Error deleting employee:', err);
                  toast.error('Error al eliminar el empleado.');
                }
              }}
              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  if (!restaurantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          No se encontró el restaurante.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-4 border-fourth-base border-t-transparent rounded-full animate-spin" />
        <SectionLoader text="Cargando nómina..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-lg w-full">
          <h3 className="text-red-700 dark:text-red-400 font-semibold mb-2">
            Error al cargar el personal
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300 font-mono break-all">
            {error.message}
          </p>
        </div>
        <button
          onClick={() => refetch()}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nómina y Personal</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona la información de tus empleados
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Nuevo Empleado
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total empleados</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{employees.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
            <User className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Activos</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
            <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nómina mensual</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {formatCOP(totalPayroll)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base"
        >
          <option value="">Todos los cargos</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Employee List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Personal — {filtered.length} empleado{filtered.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            {employees.length === 0
              ? 'Aún no hay empleados registrados. Agrega el primero.'
              : 'No se encontraron empleados con los filtros aplicados.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((emp) => {
              const statusBadge = getStatusBadge(emp.status);
              const isExpanded = expandedId === emp.id;
              return (
                <li key={emp.id}>
                  {/* Mobile card */}
                  <div className="sm:hidden p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-fourth-base/10 text-fourth-base flex items-center justify-center font-semibold text-sm">
                        {getInitials(emp.firstName, emp.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{emp.role}</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                    {(emp.email || emp.phone) && (
                      <div className="space-y-1">
                        {emp.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            {emp.email}
                          </div>
                        )}
                        {emp.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            {emp.phone}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCOP(emp.salary)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getSalaryLabel(emp.salaryType)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : emp.id)}
                          className="p-1.5 text-gray-400 hover:text-fourth-base transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(emp)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop row */}
                  <div className="hidden sm:flex px-6 py-4 items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                    {/* Avatar */}
                    <div className="shrink-0 w-10 h-10 rounded-full bg-fourth-base/10 text-fourth-base flex items-center justify-center font-semibold text-sm">
                      {getInitials(emp.firstName, emp.lastName)}
                    </div>

                    {/* Name + role */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{emp.role}</p>
                    </div>

                    {/* Email */}
                    <div className="hidden lg:flex items-center gap-1.5 min-w-0 max-w-[200px]">
                      <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {emp.email || '—'}
                      </span>
                    </div>

                    {/* Phone */}
                    <div className="hidden md:flex items-center gap-1.5 shrink-0">
                      <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {emp.phone || '—'}
                      </span>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}
                    >
                      {statusBadge.label}
                    </span>

                    {/* Salary */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCOP(emp.salary)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getSalaryLabel(emp.salaryType)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : emp.id)}
                        className="p-1.5 text-gray-400 hover:text-fourth-base transition-colors"
                        title={isExpanded ? 'Colapsar' : 'Ver detalles'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(emp)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="px-6 pb-5 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        {/* Contact */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Contacto
                          </p>
                          {emp.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                              {emp.email}
                            </div>
                          )}
                          {emp.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                              {emp.phone}
                            </div>
                          )}
                          {emp.address && (
                            <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                              {emp.address}
                            </div>
                          )}
                          {emp.cedula && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <User className="h-4 w-4 text-gray-400 shrink-0" />
                              CC {emp.cedula}
                            </div>
                          )}
                        </div>

                        {/* Seguridad social */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Seguridad Social
                          </p>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-gray-500 dark:text-gray-400">EPS: </span>
                            {emp.eps || '—'}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-gray-500 dark:text-gray-400">Pensión: </span>
                            {emp.pension || '—'}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-gray-500 dark:text-gray-400">
                              Fecha de ingreso:{' '}
                            </span>
                            {emp.startDate
                              ? parseDate(emp.startDate).toLocaleDateString('es-CO', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })
                              : '—'}
                          </div>
                        </div>

                        {/* Emergencia + notas */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Contacto de Emergencia
                          </p>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {emp.emergencyContactName || '—'}
                          </div>
                          {emp.emergencyContactPhone && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                              {emp.emergencyContactPhone}
                            </div>
                          )}
                          {emp.notes && (
                            <>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">
                                Notas
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                {emp.notes}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Información personal */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-1 border-b border-gray-100 dark:border-gray-700">
                  Información Personal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className={inputCls}
                      placeholder="Ana"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className={inputCls}
                      placeholder="García"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Cédula
                    </label>
                    <input
                      type="text"
                      value={form.cedula}
                      onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                      className={inputCls}
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Fecha de Ingreso
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputCls}
                      placeholder="ana@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={inputCls}
                      placeholder="300 000 0000"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className={inputCls}
                      placeholder="Calle 123 # 45-67, Bogotá"
                    />
                  </div>
                </div>
              </div>

              {/* Cargo y salario */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-1 border-b border-gray-100 dark:border-gray-700">
                  Cargo y Salario
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Cargo <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className={inputCls}
                    >
                      {ROLES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Estado
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className={inputCls}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Salario (COP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.salary}
                      onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
                      className={inputCls}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Tipo de pago
                    </label>
                    <select
                      value={form.salaryType}
                      onChange={(e) => setForm({ ...form, salaryType: e.target.value })}
                      className={inputCls}
                    >
                      {SALARY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Seguridad social */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-1 border-b border-gray-100 dark:border-gray-700">
                  Seguridad Social
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      EPS
                    </label>
                    <select
                      value={form.eps}
                      onChange={(e) => {
                        setForm({ ...form, eps: e.target.value });
                        if (e.target.value !== 'Otra') setEpsOther('');
                      }}
                      className={inputCls}
                    >
                      {EPS_LIST.map((e) => (
                        <option key={e}>{e}</option>
                      ))}
                    </select>
                    {form.eps === 'Otra' && (
                      <input
                        type="text"
                        value={epsOther}
                        onChange={(e) => setEpsOther(e.target.value)}
                        className={`${inputCls} mt-2`}
                        placeholder="Escribe el nombre de la EPS"
                        autoFocus
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Fondo de Pensión
                    </label>
                    <select
                      value={form.pension}
                      onChange={(e) => {
                        setForm({ ...form, pension: e.target.value });
                        if (e.target.value !== 'Otra') setPensionOther('');
                      }}
                      className={inputCls}
                    >
                      {PENSION_LIST.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                    {form.pension === 'Otra' && (
                      <input
                        type="text"
                        value={pensionOther}
                        onChange={(e) => setPensionOther(e.target.value)}
                        className={`${inputCls} mt-2`}
                        placeholder="Escribe el fondo de pensión"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Contacto de emergencia */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-1 border-b border-gray-100 dark:border-gray-700">
                  Contacto de Emergencia
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={form.emergencyContactName}
                      onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                      className={inputCls}
                      placeholder="María García"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={form.emergencyContactPhone}
                      onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                      className={inputCls}
                      placeholder="310 000 0000"
                    />
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Notas adicionales
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className={inputCls}
                  placeholder="Observaciones, habilidades especiales, horario preferido..."
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.firstName || !form.lastName}
                className="inline-flex items-center gap-2 px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {editingEmployee ? 'Actualizar' : 'Crear Empleado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
