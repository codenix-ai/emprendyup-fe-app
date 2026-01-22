'use client';
import { useRouter } from 'next/navigation';
import { Store, UtensilsCrossed, Briefcase, Palmtree } from 'lucide-react';
import AdminGuard from '@/app/components/AdminGuard';

const businessTypes = [
  {
    id: 'stores',
    title: 'Tiendas',
    description: 'Gestiona tiendas de productos y comercio electrónico',
    icon: Store,
    color: 'bg-fourth-base',
    hoverColor: 'hover:opacity-90',
  },
  {
    id: 'restaurants',
    title: 'Restaurantes',
    description: 'Administra restaurantes y servicios de comida',
    icon: UtensilsCrossed,
    color: 'bg-fourth-base',
    hoverColor: 'hover:opacity-90',
  },
  {
    id: 'services',
    title: 'Servicios',
    description: 'Controla proveedores de servicios profesionales',
    icon: Briefcase,
    color: 'bg-fourth-base',
    hoverColor: 'hover:opacity-90',
  },
  {
    id: 'tourism',
    title: 'Turismo',
    description: 'Maneja empresas y planes turísticos',
    icon: Palmtree,
    color: 'bg-fourth-base',
    hoverColor: 'hover:opacity-90',
  },
];

export default function BusinessDashboard() {
  const router = useRouter();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Panel de Administración de Negocios
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Selecciona el tipo de negocio que deseas administrar
              </p>
            </div>
          </div>
        </div>

        {/* Business Table */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo de Negocio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descripción
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {businessTypes.map((business) => {
                    const Icon = business.icon;
                    return (
                      <tr key={business.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center mr-3`}
                            >
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {business.title}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {business.description}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => router.push(`/dashboard/business/${business.id}`)}
                            className={`text-fourth-base hover:opacity-80 flex items-center gap-1`}
                          >
                            Ver detalles
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {businessTypes.map((business) => {
                const Icon = business.icon;
                return (
                  <div
                    key={business.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`h-12 w-12 rounded-full flex items-center justify-center mr-3 `}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {business.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {business.description}
                    </p>

                    <div className="flex justify-end">
                      <button
                        onClick={() => router.push(`/dashboard/business/${business.id}`)}
                        className={`px-3 py-2 rounded-lg text-sm text-white transition-colors flex items-center gap-1 bg-fourth-base`}
                      >
                        Ver detalles
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
