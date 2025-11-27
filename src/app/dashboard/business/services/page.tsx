'use client';
import { useQuery, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, MapPin, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
import AdminGuard from '@/app/components/AdminGuard';

const GET_SERVICE_PROVIDERS = gql`
  query GetAllServiceProviders {
    serviceProviders {
      id
      businessName
      type
      email
      phone
      slug
      description
      location
      address
      brandingId
      businessConfigId
      isActive
    }
  }
`;

export default function ServicesListPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading, error } = useQuery(GET_SERVICE_PROVIDERS);

  const services = data?.serviceProviders || [];
  const filteredServices = services.filter((service: any) =>
    service.businessName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fourth-base"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Proveedores de Servicios
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gestiona todos los servicios registrados
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/business/services/new')}
                className="inline-flex items-center px-4 py-2 bg-fourth-base text-white rounded-lg hover:opacity-90 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Servicio
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar servicios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fourth-base focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Servicio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ubicación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredServices.map((service: any) => (
                        <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {service.businessName}
                              </div>
                              {service.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                  {service.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {service.type && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-fourth-base dark:bg-gray-700 dark:text-fourth-base rounded">
                                {service.type}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                {service.location || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {service.phone && (
                                <div className="flex items-center mb-1">
                                  <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                  {service.phone}
                                </div>
                              )}
                              {service.email && (
                                <div className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                  {service.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {service.isActive ? (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                Activo
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded">
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() =>
                                router.push(`/dashboard/business/services/${service.id}`)
                              }
                              className="text-fourth-base hover:opacity-80 flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4 p-4">
                  {filteredServices.map((service: any) => (
                    <div
                      key={service.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {service.businessName}
                          </h3>
                          <div className="flex gap-2 mt-1">
                            {service.type && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-fourth-base dark:bg-gray-700 dark:text-fourth-base rounded">
                                {service.type}
                              </span>
                            )}
                            {service.isActive ? (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                Activo
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded">
                                Inactivo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {service.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {service.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {service.location || 'N/A'}
                        </div>
                        {service.phone && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {service.phone}
                          </div>
                        )}
                        {service.email && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {service.email}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => router.push(`/dashboard/business/services/${service.id}`)}
                          className="px-3 py-2 bg-fourth-base text-white rounded-lg text-sm hover:opacity-90 transition-colors flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!loading && filteredServices.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="h-12 w-12 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No se encontraron servicios
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? 'Intenta ajustar tu búsqueda para ver más resultados.'
                    : 'Tus servicios aparecerán aquí una vez que los crees.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
