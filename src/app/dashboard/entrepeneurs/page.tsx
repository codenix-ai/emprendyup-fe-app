'use client';

import React, { useState, useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Search,
  Send,
  MessageCircle,
  Mail,
  Globe,
  User,
  MapPin,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

// 🔹 Query GraphQL
const GET_ENTREPRENEURS = gql`
  query GetEntrepreneurs {
    entrepreneurs {
      id
      name
      email
      phone
      companyName
      city
      country
      category
      referralSource
      website
      description
      identification
      createdAt
    }
  }
`;

// 🔹 Mutation para eliminar entrepreneur
const DELETE_ENTREPRENEUR = gql`
  mutation DeleteEntrepreneur($id: String!) {
    deleteEntrepreneur(id: $id) {
      id
      name
      email
    }
  }
`;

// 🔹 Tipos TypeScript
interface Entrepreneur {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  city?: string;
  country?: string;
  category?: string;
  referralSource?: string;
  website?: string;
  description?: string;
  identification?: string;
  createdAt?: string;
}

type SortField = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

// 🔹 Función para obtener iniciales
const getInitials = (name: string): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// 🔹 Componente principal
const WhatsappCampaignPage = () => {
  const { data, loading, error, refetch } = useQuery(GET_ENTREPRENEURS);
  const [deleteEntrepreneur] = useMutation(DELETE_ENTREPRENEUR);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const entrepreneurs: Entrepreneur[] = data?.entrepreneurs || [];

  // 🔸 Función para cambiar ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // 🔸 Filtrado y ordenamiento
  const filteredEntrepreneurs = useMemo(() => {
    const filtered = entrepreneurs.filter(
      (e) =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'createdAt') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = dateA - dateB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [searchTerm, entrepreneurs, sortField, sortOrder]);

  // 🔸 Selección individual o múltiple
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEntrepreneurs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEntrepreneurs.map((e) => e.id));
    }
  };

  // 🔸 Envío de campaña de WhatsApp
  const handleSendCampaign = async () => {
    if (selectedIds.length === 0) {
      alert('Selecciona al menos un emprendedor.');
      return;
    }

    try {
      // Obtener información del usuario logueado
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user || (!user.username && !user.name && !user.email)) {
        toast.error('Error: No se pudo obtener la información del usuario');
        return;
      }

      // Construir phoneNumbers y parameters
      const phoneNumbers: string[] = [];
      const parameters: Record<
        string,
        Array<{ type: string; parameter_name: string; text: string }>
      > = {};

      selectedIds.forEach((id) => {
        const ent = entrepreneurs.find((e) => e.id === id);
        let phone = ent?.phone || '';
        if (!phone.startsWith('+')) {
          phone = `+57${phone}`;
        }
        phoneNumbers.push(phone);
        parameters[phone] = [
          {
            type: 'text',
            parameter_name: '1',
            text: ent?.name || '', // nombre del emprendedor
          },
        ];
      });

      const payload = {
        phoneNumbers,
        templateName: process.env.NEXT_PUBLIC_WS_TEMPLATE_ID, // Nuevo templateName solicitado
        languageCode: 'es',
        parameters,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Error del servidor:', errorData);
          toast.error(`Error al enviar la campaña: ${errorData.message || response.statusText}`);
        } else {
          const text = await response.text();
          console.error('Respuesta no JSON:', text);
          toast.error(
            'Error al enviar la campaña: El servidor respondió con un formato inesperado.'
          );
        }
        return;
      }

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        toast.success(
          `✅ Campaña procesada: ${data.success} exitosos, ${data.failed} fallidos de ${data.total} total.`
        );
      } else {
        const text = await response.text();
        console.error('Respuesta no JSON:', text);
        toast.error('La campaña fue enviada pero la respuesta no es JSON. Revisa la consola.');
      }
    } catch (error) {
      console.error('Error general al enviar la campaña:', error);
      toast.error('Hubo un error al enviar la campaña. Revisa la consola.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar a ${name}? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await deleteEntrepreneur({
        variables: { id },
        refetchQueries: [{ query: GET_ENTREPRENEURS }],
      });

      toast.success(`${name} ha sido eliminado exitosamente`);
      refetch();
    } catch (error) {
      console.error('Error al eliminar entrepreneur:', error);
      toast.error('Error al eliminar el emprendedor. Por favor, intenta de nuevo.');
    }
  };

  // 🔸 Exportar a CSV
  const handleExportCSV = () => {
    const dataToExport = filteredEntrepreneurs.length > 0 ? filteredEntrepreneurs : entrepreneurs;

    if (dataToExport.length === 0) {
      toast.error('No hay emprendedores para exportar');
      return;
    }

    // Encabezados del CSV
    const headers = [
      'Nombre',
      'Email',
      'Teléfono',
      'Empresa',
      'Ciudad',
      'País',
      'Categoría',
      'Fuente',
      'Website',
      'Descripción',
      'Identificación',
      'Fecha Creación',
    ];

    // Convertir datos a filas CSV (formato simple: solo email y campos opcionales)
    const rows = dataToExport.map((e) => [
      e.name || '',
      e.email || '',
      e.phone || '',
      e.companyName || '',
      e.city || '',
      e.country || '',
      e.category || '',
      e.referralSource || '',
      e.website || '',
      (e.description || '').replace(/[\n\r]/g, ' '), // Eliminar saltos de línea
      e.createdAt ? new Date(e.createdAt).toLocaleDateString('es-ES') : '',
    ]);

    // Crear contenido CSV: sanitizar comas internas y saltos de línea
    const csvContent = rows
      .map((row) =>
        row
          .map(
            (cell) =>
              String(cell)
                .replace(/,/g, ' ') // 🔴 IMPORTANTE: eliminar comas internas
                .replace(/[\n\r]/g, ' ') // eliminar saltos de línea
          )
          .join(',')
      )
      .join('\n');

    // Crear Blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `emprendedores_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Se exportaron ${dataToExport.length} emprendedores`);
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Cargando emprendedores...
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">Error: {error.message}</div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-full w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Campañas de WhatsApp
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Selecciona emprendedores para enviar mensajes personalizados
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button
              onClick={handleSendCampaign}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
              Enviar campaña
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-max w-full">
              <thead className="bg-gray-100 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredEntrepreneurs.length &&
                        filteredEntrepreneurs.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="accent-green-600 h-4 w-4"
                    />
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Emprendedor
                      {sortField === 'name' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      Fecha Creación
                      {sortField === 'createdAt' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ciudad
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Website
                  </th>
                  <th className="hidden xl:table-cell px-8 py-5 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Descripción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEntrepreneurs.map((e) => (
                  <tr
                    key={e.id}
                    className={`transition-colors ${
                      selectedIds.includes(e.id)
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(e.id)}
                          onChange={() => toggleSelect(e.id)}
                          className="accent-green-600 h-4 w-4"
                        />
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleDelete(e.id, e.name);
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Eliminar emprendedor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            {getInitials(e.name)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {e.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 overflow-hidden">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{e.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <MessageCircle className="w-4 h-4 text-gray-400" />
                        {e.phone || 'No registrado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {e.companyName || 'No registrado'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {e.createdAt
                        ? new Date(e.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {e.city || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {e.website ? (
                        <a
                          href={e.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <Globe className="w-4 h-4" />
                          Ver sitio
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">No disponible</span>
                      )}
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs">
                      <div className="line-clamp-2" title={e.description}>
                        {e.description || 'Sin descripción'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntrepreneurs.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No se encontraron emprendedores.
            </div>
          )}
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-4">
          {/* Select All for Mobile */}
          {filteredEntrepreneurs.length > 0 && (
            <div className="flex items-center gap-3 px-2 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                checked={
                  selectedIds.length === filteredEntrepreneurs.length &&
                  filteredEntrepreneurs.length > 0
                }
                onChange={toggleSelectAll}
                className="accent-green-600 h-5 w-5"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Seleccionar todos ({filteredEntrepreneurs.length})
              </span>
            </div>
          )}

          {filteredEntrepreneurs.map((e) => (
            <div
              key={e.id}
              onClick={() => toggleSelect(e.id)}
              className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                selectedIds.includes(e.id)
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {e.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{e.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {e.companyName || 'No registrado'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(e.id)}
                  onChange={() => toggleSelect(e.id)}
                  className="accent-green-600 h-5 w-5 mt-1"
                  onClick={(ev) => ev.stopPropagation()}
                />
              </div>

              <div className="space-y-2.5 pl-1">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{e.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{e.phone || 'No registrado'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{e.city || 'N/A'}</span>
                </div>
                {e.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <a
                      href={e.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      {e.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {e.description && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {e.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleDelete(e.id, e.name);
                  }}
                  className="flex items-center gap-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {filteredEntrepreneurs.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No se encontraron emprendedores.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsappCampaignPage;
