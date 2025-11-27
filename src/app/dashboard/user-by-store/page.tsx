'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Store,
  UserCheck,
  Building2,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import { gql, useQuery } from '@apollo/client';

const GET_USERS_BY_STORE = gql`
  query GetUsersByStore($storeId: String!) {
    usersByStore(storeId: $storeId) {
      id
      name
      email
    }
  }
`;

// Tipos de TypeScript
interface User {
  id: string;
  name: string;
  email: string;
}

interface UserData {
  storeId?: string;
  storeName?: string;
  [key: string]: any;
}

// Componente KPICard
const KPICard = ({
  icon: Icon,
  title,
  value,
  trend,
}: {
  icon: React.ComponentType<any>;
  title: string;
  value: string;
  trend?: { value: number; isPositive: boolean };
}) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {trend && (
          <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↗' : '↘'} {trend.value}%
          </p>
        )}
      </div>
      <Icon className="h-8 w-8 text-blue-600" />
    </div>
  </div>
);

// Componente UserCard para móvil
const UserCard = ({ user, getInitials }: { user: User; getInitials: (name: string) => string }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {getInitials(user.name)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2">
        <button className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2">
          <Edit className="h-4 w-4" />
        </button>
        <button className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono text-gray-800 dark:text-gray-200">
        ID: {user.id}
      </code>
    </div>
  </div>
);

const UsersByStorePage = () => {
  const [userData, setUserData] = useState<UserData>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Effect para obtener userData del localStorage
  useEffect(() => {
    setIsClient(true);
    try {
      const storedUserData = JSON.parse(localStorage.getItem('user') || '{}');
      setUserData(storedUserData);
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      setUserData({});
    }
  }, []);

  // Query para obtener usuarios por tienda
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useQuery(GET_USERS_BY_STORE, {
    variables: { storeId: userData?.storeId || '' },
    skip: !userData?.storeId || !isClient,
  });

  // Obtener usuarios
  const users: User[] = usersData?.usersByStore || [];

  // Filtrar usuarios por búsqueda
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, users]);

  // Estadísticas calculadas
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const filteredCount = filteredUsers.length;

    return {
      totalUsers,
      filteredCount,
    };
  }, [users, filteredUsers]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // No mostrar nada hasta que se monte en el cliente
  if (!isClient) {
    return null;
  }

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
              Error al cargar usuarios
            </h3>
            <p className="text-red-600 dark:text-red-400">{usersError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData?.storeId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <Store className="mx-auto h-12 w-12 text-yellow-600 dark:text-yellow-400 mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
              No hay tienda asignada
            </h3>
            <p className="text-yellow-600 dark:text-yellow-400">
              El usuario no tiene una tienda asignada en el sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Usuarios de la Tienda
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4 text-gray-500" />
              <p className="text-gray-600 dark:text-gray-400">
                {userData?.storeName || `Store ID: ${userData.storeId}`}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <KPICard
            icon={Users}
            title="Total Usuarios"
            value={stats.totalUsers.toString()}
            trend={{ value: 8, isPositive: true }}
          />
          <KPICard
            icon={UserCheck}
            title="Usuarios Filtrados"
            value={stats.filteredCount.toString()}
          />
          <KPICard
            icon={Building2}
            title="Store ID"
            value={userData.storeId?.slice(-4) || '----'}
          />
          <KPICard icon={Store} title="Tienda Actual" value="1" />
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 && !usersLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay usuarios
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? 'No se encontraron usuarios con los filtros aplicados.'
                : 'Esta tienda no tiene usuarios asignados.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden">
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 px-1">
                  Mostrando {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
                </div>
                {filteredUsers.map((user) => (
                  <UserCard key={user.id} user={user} getInitials={getInitials} />
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Lista de Usuarios
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}{' '}
                      encontrado{filteredUsers.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                {getInitials(user.name)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                            {user.id}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UsersByStorePage;
