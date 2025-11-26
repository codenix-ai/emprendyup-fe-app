'use client';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle, Info, MapPin, ImageIcon, Building } from 'lucide-react';
import { useSessionStore } from '@/lib/store/dashboard';
import Image from 'next/image';
import FileUpload from '@/app/components/FileUpload';

const GET_RESTAURANT = gql`
  query GetRestaurant($id: ID!) {
    restaurant(id: $id) {
      id
      name
      description
      cuisineType
      city
      address
      phone
      coverImage
      googleLocation
      brandingId
      businessConfigId
      createdAt
      updatedAt
      menuImages {
        id
        imageUrl
        title
        description
      }
    }
  }
`;

const UPDATE_RESTAURANT = gql`
  mutation UpdateRestaurant($id: ID!, $input: UpdateRestaurantInput!) {
    updateRestaurant(id: $id, input: $input) {
      id
      name
      description
      cuisineType
      city
      address
      coverImage
      phone
      googleLocation
    }
  }
`;

export default function RestaurantDetailPage() {
  const router = useRouter();
  const { user } = useSessionStore();
  const restaurantId = user?.restaurantId;

  const { data, loading, error } = useQuery(GET_RESTAURANT, {
    variables: { id: restaurantId },
    skip: !restaurantId,
  });

  const [updateRestaurant] = useMutation(UPDATE_RESTAURANT);
  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('details');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (data?.restaurant) {
      setFormData(data.restaurant);
    }
  }, [data]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const resolveImageUrl = (value?: string) => {
    if (!value) return '';
    if (
      value.startsWith('http') ||
      value.startsWith('https') ||
      value.startsWith('blob:') ||
      value.startsWith('data:')
    ) {
      return value;
    }
    return `https://emprendyup-images.s3.us-east-1.amazonaws.com/${value}`;
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const {
        id: _id,
        brandingId: _brandingId,
        businessConfigId: _businessConfigId,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        menuImages: _menuImages,
        __typename,
        ...inputData
      } = formData;

      await updateRestaurant({
        variables: {
          id: restaurantId,
          input: inputData,
        },
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleRemoveImage = (field: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: '' }));
  };

  const tabs = [
    { id: 'details', label: 'Detalles', icon: Info },
    { id: 'location', label: 'Ubicación', icon: MapPin },
    { id: 'images', label: 'Imágenes', icon: ImageIcon },
    { id: 'menu', label: 'Menú', icon: Building },
  ];

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No se encontró el ID del restaurante</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--fourth-base)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  const inputClassName =
    'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--fourth-base)] focus:border-transparent';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex justify-between items-start">
            <div>
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
              >
                ← Volver
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configuración de Restaurante
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{formData.name}</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center px-4 py-2 bg-[var(--fourth-base)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saveStatus === 'saving' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : saveStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <nav className="container mx-auto px-6">
            <div className="flex gap-2 overflow-x-auto py-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-[var(--fourth-base)] text-white shadow'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 p-6 mt-6">
            <div className="w-full">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Información General
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre del Restaurante
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className={inputClassName}
                            placeholder="Nombre del restaurante"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo de Cocina
                          </label>
                          <input
                            type="text"
                            name="cuisineType"
                            value={formData.cuisineType || ''}
                            onChange={handleInputChange}
                            className={inputClassName}
                            placeholder="Ej: Italiana, Mexicana, etc."
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Descripción
                        </label>
                        <textarea
                          name="description"
                          value={formData.description || ''}
                          onChange={handleInputChange}
                          rows={4}
                          className={inputClassName}
                          placeholder="Describe tu restaurante..."
                        />
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          className={inputClassName}
                          placeholder="+57 300 123 4567"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Tab */}
              {activeTab === 'location' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Ubicación
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Ciudad
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city || ''}
                            onChange={handleInputChange}
                            className={inputClassName}
                            placeholder="Bogotá"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Dirección Completa
                          </label>
                          <textarea
                            name="address"
                            value={formData.address || ''}
                            onChange={handleInputChange}
                            rows={3}
                            className={inputClassName}
                            placeholder="Calle 72 #10-15, Bogotá, Colombia"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Google Maps URL
                          </label>
                          <input
                            type="url"
                            name="googleLocation"
                            value={formData.googleLocation || ''}
                            onChange={handleInputChange}
                            className={inputClassName}
                            placeholder="https://maps.google.com/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Images Tab */}
              {activeTab === 'images' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Imágenes
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Imagen de Portada
                          </label>
                          {formData.coverImage && resolveImageUrl(formData.coverImage) ? (
                            <div className="relative">
                              <Image
                                src={resolveImageUrl(formData.coverImage)}
                                alt="Cover"
                                width={400}
                                height={200}
                                className="w-full h-48 object-cover rounded-lg"
                                unoptimized
                              />
                              <button
                                onClick={() => handleRemoveImage('coverImage')}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <AlertCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <FileUpload
                              onFile={(url: string) =>
                                setFormData((prev: any) => ({ ...prev, coverImage: url }))
                              }
                              accept="image/*"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Tab */}
              {activeTab === 'menu' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Menú del Restaurante
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      {formData.menuImages && formData.menuImages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {formData.menuImages.map((menuImage: any) => (
                            <div
                              key={menuImage.id}
                              className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                            >
                              <Image
                                src={menuImage.imageUrl}
                                alt={menuImage.title || 'Menu'}
                                width={300}
                                height={200}
                                className="w-full h-48 object-cover"
                                unoptimized
                              />
                              {menuImage.title && (
                                <div className="p-3">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {menuImage.title}
                                  </h4>
                                  {menuImage.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {menuImage.description}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No hay imágenes de menú disponibles
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Status Toast */}
      {saveStatus === 'success' && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Cambios guardados correctamente
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Error al guardar los cambios
        </div>
      )}
    </div>
  );
}
